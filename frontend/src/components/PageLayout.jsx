/**
 * PageLayout — wraps every page with consistent top padding for the fixed navbar
 * Usage: <PageLayout>...</PageLayout>
 * Usage with max-width: <PageLayout inner>...</PageLayout>
 */
export default function PageLayout({ children, inner = false, className = "" }) {
  return (
    <div className={`min-h-screen bg-[#080808] text-white pt-14 ${className}`}>
      {inner ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 pb-24">
          {children}
        </div>
      ) : children}
    </div>
  );
}
