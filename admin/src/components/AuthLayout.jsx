export function AuthLayout({ title, subtitle, children, footer }) {
    return (
        <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <aside className="relative hidden flex-col justify-between overflow-hidden bg-spine p-12 text-sand lg:flex">
                <div className="flex items-center gap-3">
                    <img src="/Logo.png" alt="" width="48" height="37" className="h-9 w-auto brightness-0 invert" />
                    <span className="text-xl font-extrabold text-white">GreatRead</span>
                </div>
                <div>
                    <p className="max-w-sm text-3xl font-extrabold leading-tight text-white">
                        Every book on the shelf started as a few good notes.
                    </p>
                    <p className="mt-4 max-w-sm text-[15px] text-sand/75">
                        Add books, keep their notes tidy and choose what readers see first.
                    </p>
                </div>
                <div aria-hidden="true" className="flex items-end gap-2">
                    {[64, 96, 80, 112, 72, 104, 88].map((h, i) => (
                        <span
                            key={i}
                            style={{ height: h }}
                            className={`w-8 rounded-t-sm ${i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-[#E9C07A]" : "bg-secondary"}`}
                        />
                    ))}
                    <span className="ml-2 h-1 flex-1 rounded-sm bg-sand/30" />
                </div>
            </aside>

            <main className="flex items-center justify-center px-5 py-10 sm:px-10">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <img src="/Logo.png" alt="" width="40" height="31" className="h-8 w-auto" />
                        <span className="text-lg font-extrabold text-secondary">GreatRead Admin</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-secondary">{title}</h1>
                    {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
                    <div className="mt-8">{children}</div>
                    {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
                </div>
            </main>
        </div>
    );
}
