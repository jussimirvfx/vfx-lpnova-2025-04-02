"use client"

export function StatsCardMobile() {
  return (
    <div className="w-full h-[180px] flex flex-col items-center justify-center bg-white p-5 text-center">
      <h3 className="text-4xl font-bold text-[#2563eb] mb-2">R$ 8.2 Milhões+</h3>
      <p className="text-gray-700 font-medium mb-3">Em campanhas gerenciadas</p>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-[#2563eb]" style={{ width: "50%" }}></div>
      </div>
    </div>
  )
}

