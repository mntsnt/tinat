import { notFound, redirect } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import StudyQuestionnaire from "./StudyQuestionnaire";

type RouteParams = {
  id?: string;
};

type Props = {
  params?: RouteParams | Promise<RouteParams>;
};

export default async function StudyPage(props: Props) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const rawParams = props?.params;
  const params = rawParams
    ? await Promise.resolve(rawParams)
    : {};

  const id = params.id;

  if (!id) {
    notFound();
  }

  const study = await prisma.study.findUnique({
    where: {
      id,
    },
    include: {
      researcher: {
        select: {
          name: true,
        },
      },
      questions: {
        include: {
          options: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!study || study.status !== "ACTIVE") {
    notFound();
  }

  return <StudyQuestionnaire study={study} />;
}