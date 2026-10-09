import re

with open('app/admin/users/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add faydaVerified and faydaVerifiedAt to the Prisma select
prisma_select = """
      yearOfStudy: true,
      createdAt: true,
      faydaVerified: true,
      faydaVerifiedAt: true,
      wallet: { select: { balance: true } },
"""
content = re.sub(
    r'yearOfStudy: true,\s*createdAt: true,\s*wallet: { select: { balance: true } },',
    prisma_select,
    content
)

# Add ShieldCheck icon import
content = content.replace('import { Badge } from "../../components/ui/Badge";', 'import { Badge } from "../../components/ui/Badge";\nimport { ShieldCheck } from "lucide-react";')

# Inject Fayda Verification status next to the Name
user_name_html = """<td className="px-6 py-4 align-top">
                      <div className="font-medium text-foreground flex items-center gap-2">
                        {user.name}
                        {user.faydaVerified && (
                          <div title={`Fayda Verified on ${user.faydaVerifiedAt?.toLocaleDateString()}`} className="flex items-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-full px-1.5 py-0.5 border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
                          </div>
                        )}
                      </div>
                      <div className="text-muted-foreground">{user.email}</div>
                    </td>"""
content = re.sub(
    r'<td className="px-6 py-4 align-top">\s*<div className="font-medium text-foreground">{user\.name}</div>\s*<div className="text-muted-foreground">{user\.email}</div>\s*</td>',
    user_name_html,
    content
)

with open('app/admin/users/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
