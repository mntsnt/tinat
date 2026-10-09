import re

with open('app/projects/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'return \(\s*<div className="min-h-screen bg-slate-50.*?<div className="flex flex-col sm:flex-row items-stretch', re.DOTALL)

replacement = """return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:px-7 md:py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1 tracking-wide uppercase">
            <FolderKanban className="w-4 h-4" />
            Collaborative Health Research
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Research Projects & Teams
          </h1>
          <p className="mt-1 text-muted-foreground max-w-2xl text-sm leading-relaxed">
            End-to-end academic and clinical research workspaces from hypothesis and protocol to data collection, analysis, and peer-reviewed publication.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm transition-all hover:shadow text-sm"
          >
            <Plus className="w-4 h-4" />
            New Research Project
          </Link>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-3.5 rounded-xl bg-card border border-border shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">Total Workspaces</div>
          <div className="text-2xl font-bold text-foreground mt-0.5">{stats.total}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
          <div className="text-xs font-medium text-primary">Active Investigations</div>
          <div className="text-2xl font-bold text-primary mt-0.5">{stats.active}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm dark:bg-emerald-500/10 dark:border-emerald-500/20">
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Completed & Published</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.completed}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-card border border-border shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">Team Members</div>
          <div className="text-2xl font-bold text-foreground mt-0.5">{stats.totalMembers}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch"""

new_content = pattern.sub(replacement, content)
new_content = new_content.replace('          </div>\n        </div>\n      </div>\n    </div>\n  );\n}', '        </div>\n      </div>\n    </div>\n  );\n}')
new_content = new_content.replace('        </div>\n      </div>\n    </div>\n  );\n}', '      </div>\n    </div>\n  );\n}')

with open('app/projects/page.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
