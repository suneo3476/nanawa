// src/app/heatmap/loading.tsx

export default function HeatmapLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">演奏頻度ヒートマップ</h1>
        <p className="text-gray-600 mb-6">
          各楽曲の時期ごとの演奏頻度を色の濃淡で表現。「七輪」のレパートリー変遷を一目で把握できます。
        </p>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">演奏頻度ヒートマップ</h2>
          
          {/* コントロールセクションのスケルトン */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col">
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          
          {/* テーブルのスケルトン */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-gray-50 py-3 px-4 border-b border-gray-200 text-left">
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="bg-gray-50 py-3 px-4 border-b border-gray-200 text-center">
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  </th>
                  {[...Array(8)].map((_, i) => (
                    <th key={i} className="bg-gray-50 py-3 px-3 border-b border-gray-200 text-center">
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(10)].map((_, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? '' : 'bg-gray-50'}>
                    <td className="py-4 px-4 border-b border-gray-200">
                      <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="py-4 px-3 border-b border-gray-200 text-center">
                      <div className="h-6 w-12 bg-gray-200 rounded-full animate-pulse mx-auto"></div>
                    </td>
                    {[...Array(8)].map((_, cellIndex) => (
                      <td key={cellIndex} className="py-4 px-3 border-b border-gray-200 text-center">
                        <div 
                          className="h-8 w-8 rounded animate-pulse mx-auto"
                          style={{ 
                            backgroundColor: `rgba(124, 58, 237, ${Math.random() * 0.3})` 
                          }}
                        ></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}