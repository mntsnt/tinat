import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";

type RouteParams = {
  id?: string;
};

type Props = {
  params?: RouteParams | Promise<RouteParams>;
};

type ChapaInitializeResponse = {
  status?: string;
  message?: string;
  data?: {
    checkout_url?: string;
    reference?: string;
  };
};

export async function POST(
  request: Request,
  props: Props
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const rawParams = props?.params;
    const params = rawParams
      ? await Promise.resolve(rawParams)
      : {};

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Study id is required." },
        { status: 400 }
      );
    }

    const study = await prisma.study.findUnique({
      where: {
        id,
      },
      include: {
        researcher: true,
      },
    });

    if (!study) {
      return NextResponse.json(
        { error: "Study not found." },
        { status: 404 }
      );
    }

    if (study.researcherId !== session.userId) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to fund this study.",
        },
        { status: 403 }
      );
    }

    if (study.status !== "DRAFT") {
      return NextResponse.json(
        {
          error:
            "Only draft studies can be funded.",
        },
        { status: 400 }
      );
    }

    if (study.budgetCredits <= 0) {
      return NextResponse.json(
        {
          error:
            "This study does not have a valid budget.",
        },
        { status: 400 }
      );
    }

    const secretKey = process.env.CHAPA_SECRET_KEY;

    if (!secretKey) {
      console.error("CHAPA_SECRET_KEY is missing.");

      return NextResponse.json(
        {
          error:
            "Chapa is not configured on the server.",
        },
        { status: 500 }
      );
    }

    const amount = Number(study.budgetCredits);
    const txRef = `tinat-${study.id}-${crypto
      .randomBytes(8)
      .toString("hex")}`;

    // Validate and sanitize email
    const email = (study.researcher.email || "").toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          error: `Invalid researcher email: ${email}. Please update your profile with a valid email.`,
        },
        { status: 400 }
      );
    }

    const appBaseUrl =
      process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;

    if (!appBaseUrl || !/^https:\/\//i.test(appBaseUrl)) {
      return NextResponse.json(
        {
          error:
            "Chapa requires a public HTTPS app URL. Set APP_URL or NEXT_PUBLIC_APP_URL to your production or ngrok URL.",
        },
        { status: 500 }
      );
    }

    // Development mode: bypass Chapa for test emails
    if (
      process.env.NODE_ENV === "development" &&
      email.includes("@test.com")
    ) {
      console.log("Development mode: auto-funding study with test email");

      await prisma.$transaction([
        prisma.studyPayment.create({
          data: {
            studyId: study.id,
            researcherId: study.researcherId,
            amount,
            currency: "ETB",
            txRef,
            status: "SUCCESS",
          },
        }),
        prisma.study.update({
          where: { id },
          data: { status: "ACTIVE" },
        }),
      ]);

      await logActivity({
        userId: session.userId,
        action: "STUDY_FUNDED",
        description: `Study ${id} funded successfully (dev mode)`,
        resourceId: id,
        resourceType: "Study",
      });

      // Return redirect to study page
      return NextResponse.json({
        success: true,
        checkoutUrl: appBaseUrl + "/researcher/studies/" + id,
        devMode: true,
      });
    }

    // Production flow: create PENDING payment record for Chapa
    await prisma.studyPayment.create({
      data: {
        studyId: study.id,
        researcherId: study.researcherId,
        amount,
        currency: "ETB",
        txRef,
        status: "PENDING",
      },
    });

    console.log("DEBUG: Researcher email:", email);
    console.log("DEBUG: Researcher name:", study.researcher.name);

    // Sanitize name fields
    const nameParts = (study.researcher.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "Researcher";
    const lastName = nameParts.slice(1).join(" ") || "User";

    console.log("DEBUG: Sending to Chapa - email:", email, "firstName:", firstName, "lastName:", lastName);

    const callbackUrl = new URL(
      "/api/auth/payments/chapa/callback",
      appBaseUrl
    ).toString();
    const returnUrl = new URL(
      `/researcher/studies/${study.id}`,
      appBaseUrl
    ).toString();

    const chapaResponse = await fetch(
      "https://api.chapa.co/v1/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  amount: String(amount),
  currency: "ETB",

  email: email,

  first_name: firstName,

  last_name: lastName,

  tx_ref: txRef,

  callback_url: callbackUrl,

  return_url: returnUrl,

  customization: {
    title: "Tinat Study",
    description: "Research study funding",
  },

  meta: {
    study_id: study.id,
    researcher_id: study.researcherId,
    payment_type: "STUDY_FUNDING",
  },
}),
      }
    );

    let chapaData: ChapaInitializeResponse = {};

    try {
      chapaData = (await chapaResponse.json()) as ChapaInitializeResponse;
    } catch {
      const text = await chapaResponse.text();
      console.error("Non-JSON Chapa response:", text);
      chapaData = { message: text || "Unexpected Chapa response." };
    }

    console.log("Chapa initialize response:", chapaData);

    if (
      !chapaResponse.ok ||
      chapaData.status !== "success" ||
      !chapaData.data?.checkout_url
    ) {
      await prisma.studyPayment.update({
        where: {
          txRef,
        },
        data: {
          status: "FAILED",
        },
      });

      const paymentError =
        typeof chapaData.message === "string"
          ? chapaData.message
          : typeof chapaData.data?.reference === "string"
            ? `Chapa rejected the payment: ${chapaData.data.reference}`
            : "Unable to initialize Chapa payment.";

      return NextResponse.json(
        {
          error: paymentError,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: chapaData.data.checkout_url,
    });
  } catch (error) {
    console.error("Chapa payment initialization error:", error);

    return NextResponse.json(
      {
        error: "Failed to initialize payment.",
      },
      { status: 500 }
    );
  }
}
