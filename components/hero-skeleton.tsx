export function HeroSkeleton() {
  return (
    <div className="min-h-[500px] w-full animate-pulse">
      <div className="container mx-auto pt-8 sm:pt-32">
        <div className="max-w-3xl">
          {/* Placeholder para o título com dimensões fixas */}
          <div className="h-[120px] bg-gray-200 rounded-lg w-full mb-6"></div>

          {/* Placeholder para o subtítulo */}
          <div className="h-6 bg-gray-100 rounded w-full max-w-md mb-2"></div>
          <div className="h-6 bg-gray-100 rounded w-5/6 max-w-md mb-2"></div>
          <div className="h-6 bg-gray-100 rounded w-4/6 max-w-md mb-8"></div>

          {/* Placeholder para o formulário */}
          <div className="h-12 bg-gray-200 rounded-lg w-full max-w-md mb-4"></div>
          <div className="h-12 bg-gray-100 rounded-lg w-full max-w-md"></div>
        </div>
      </div>
    </div>
  )
}

