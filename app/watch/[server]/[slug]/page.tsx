"use client"
import { useSearchParams, useParams } from "next/navigation"

export default function WatchMoviePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  
  const slug = params?.slug as string
  const currentEp = searchParams?.get("ep") || "1"
  const videoUrl = searchParams?.get("url") || ""

  // Giải mã ngược link stream video nhận từ URL
  const decodedUrl = videoUrl ? decodeURIComponent(videoUrl) : ""

  if (!decodedUrl) {
    return (
      <div className="bg-[#0b0b0b] min-h-screen flex items-center justify-center text-zinc-500 text-sm">
        Đường truyền video lỗi hoặc không tồn tại. Vui lòng quay lại danh sách tập!
      </div>
    )
  }

  return (
    <div className="bg-[#0b0b0b] min-h-screen text-zinc-300 pt-[85px] pb-12 px-4">
      <div className="max-w-[1200px] mx-auto">
        
        {/* KHỐI TRÌNH PHÁT VIDEO PLAYER */}
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-zinc-900 shadow-2xl">
          <iframe
            src={decodedUrl}
            className="w-full h-full absolute top-0 left-0"
            allowFullScreen
            scrolling="no"
            frameBorder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
          ></iframe>
        </div>

        {/* THÔNG TIN TẬP ĐANG XEM */}
        <div className="mt-5 bg-[#0f0f0f] border border-zinc-900 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wide">
              Đang phát: <span className="text-orange-500 capitalize">{slug?.replace(/-/g, " ")}</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Tập phim hiện tại: {currentEp}</p>
          </div>

          <a
            href={`/movie/${params?.server}/${slug}`}
            className="text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 hover:text-orange-500 px-4 py-2 rounded-lg transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-arrow-left text-[10px]"></i>
            <span>Quay lại danh sách tập</span>
          </a>
        </div>

      </div>
    </div>
  )
}