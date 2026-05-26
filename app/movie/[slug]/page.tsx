"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image"; // IMPORT THÊM ĐỂ HIỂN THỊ LOGO ĐÚNG CHUẨN NEXT.JS

interface MovieDetail {
  _id: string;
  name: string;
  origin_name: string;
  content: string;
  thumb_url: string;
  poster_url: string;
  trailer_url?: string;
  time: string;
  episode_current: string;
  quality: string;
  lang: string;
  year: number;
  actor: string[];
  director: string[];
  category: { id: string; name: string; slug: string }[];
  country: { id: string; name: string; slug: string }[];
}

interface EpisodeItem {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

interface ServerItem {
  server_name: string;
  server_data: EpisodeItem[];
}

interface FilterItem {
  _id: string;
  name: string;
  slug: string;
}

interface RelatedMovie {
  _id: string;
  name: string;
  origin_name: string;
  slug: string;
  poster_url: string;
  thumb_url: string;
  episode_current: string;
  quality: string;
  lang: string;
}

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [relatedMovies, setRelatedMovies] = useState<RelatedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorApi, setErrorApi] = useState(false);

  const [showPlayer, setShowPlayer] = useState<boolean>(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const relatedRef = useRef<HTMLDivElement>(null);

  const [currentLink, setCurrentLink] = useState<string>("");
  const [currentBackupLink, setCurrentBackupLink] = useState<string>("");
  const [playerType, setPlayerType] = useState<"embed" | "m3u8">("embed");
  const [currentEpisodeName, setCurrentEpisodeName] = useState<string>("");

  // STATE QUẢN LÝ NÚT SERVER ĐANG CHỌN (Mặc định là SERVER 1)
  const [activeServerTab, setActiveServerTab] = useState<number>(1);

  const [genres, setGenres] = useState<FilterItem[]>([]);
  const [countries, setCountries] = useState<FilterItem[]>([]);
  const years = ["2026", "2025", "2024", "2023", "2022"];
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [commentText, setCommentText] = useState("");

  const getCleanImageUrl = (url: string) => {
    if (!url) return "https://placehold.co/300x450/000/fff?text=No+Image";
    if (url.includes("phimimg.com")) {
      return url.replace("https://phimimg.com", "https://img.phimapi.com")
                .replace("http://phimimg.com", "https://img.phimapi.com");
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://img.phimapi.com/${url}`;
  };

  const loadMenuFilters = async () => {
    try {
      const [resGenres, resCountries] = await Promise.all([
        fetch("https://phimapi.com/the-loai"),
        fetch("https://phimapi.com/quoc-gia")
      ]);
      const dataGenres = await resGenres.json();
      const dataCountries = await resCountries.json();
      if (Array.isArray(dataGenres)) setGenres(dataGenres.slice(0, 12));
      if (Array.isArray(dataCountries)) setCountries(dataCountries.slice(0, 10));
    } catch (error) {
      console.error("Lỗi lấy danh sách bộ lọc menu:", error);
    }
  };

  const loadRelatedMoviesByGenre = async (genreSlug: string, currentMovieId: string) => {
    try {
      const res = await fetch(`https://phimapi.com/v1/api/the-loai/${genreSlug}?limit=12`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.data && data.data.items) {
          const filtered = data.data.items.filter((item: any) => item._id !== currentMovieId);
          setRelatedMovies(filtered.slice(0, 8));
        }
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách phim cùng thể loại:", error);
    }
  };

  useEffect(() => {
    if (!slug) return;
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        setErrorApi(false);
        setShowPlayer(false); 
        
        const res = await fetch(`https://phimapi.com/phim/${slug}`);
        if (!res.ok) throw new Error("Không thể kết nối tới máy chủ API phim");
        const data = await res.json();

        if (data && data.movie) {
          const currentMovie = data.movie;
          setMovie(currentMovie);
          
          const episodesData = data.episodes || [];
          setServers(episodesData);

          if (episodesData.length > 0 && episodesData[0].server_data?.length > 0) {
            const firstEp = episodesData[0].server_data[0];
            setCurrentLink(firstEp.link_embed);
            setCurrentBackupLink(firstEp.link_m3u8);
            setCurrentEpisodeName(firstEp.name);
            setActiveServerTab(1); // Mặc định vào chọn Server 1 Vietsub
          }

          if (currentMovie.category && currentMovie.category.length > 0) {
            loadRelatedMoviesByGenre(currentMovie.category[0].slug, currentMovie._id);
          }
        } else {
          setErrorApi(true);
        }
      } catch (error) {
        console.error("Lỗi lấy chi tiết phim từ API:", error);
        setErrorApi(true);
      } finally {
        setLoading(false);
      }
    };

    Promise.all([fetchMovieData(), loadMenuFilters()]);
  }, [slug]);

  const handleSelectEpisode = (ep: EpisodeItem, type: "embed" | "m3u8", tabId: number) => {
    setCurrentLink(ep.link_embed);
    setCurrentBackupLink(ep.link_m3u8);
    setCurrentEpisodeName(ep.name);
    setPlayerType(type); 
    setShowPlayer(true);
    setActiveServerTab(tabId);
    
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const getEpisodesByServerTab = (tabId: number): EpisodeItem[] => {
    if (servers.length === 0) return [];
    
    const vietsubServer = servers[0];
    const longTiengServer = servers.find(s => 
      s.server_name.toLowerCase().includes("lồng tiếng") || 
      s.server_name.toLowerCase().includes("longtieng") ||
      s.server_name.toLowerCase().includes("thuyết minh") ||
      s.server_name.toLowerCase().includes("thuyetminh")
    ) || servers[1]; 

    if (tabId === 1 && vietsubServer) return vietsubServer.server_data || [];
    if (tabId === 2 && vietsubServer) return vietsubServer.server_data || [];
    if (tabId === 3 && longTiengServer) return longTiengServer.server_data || [];
    if (tabId === 4 && longTiengServer) return longTiengServer.server_data || [];

    return [];
  };

  const getPlayerTypeByTab = (tabId: number) => {
    return (tabId === 1 || tabId === 3) ? "embed" : "m3u8";
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchKeyword.trim() !== "") {
      router.push(`/?search=${encodeURIComponent(searchKeyword.trim())}`);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: "#060606", color: "#8a3ffc", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "'Inter', sans-serif", fontWeight: "600", fontSize: "14px" }}>
        ĐANG TẢI DỮ LIỆU PHIM MEEPHIM... VUI LÒNG CHỜ GIÂY LÁT!
      </div>
    );
  }

  if (errorApi || !movie) {
    return (
      <div style={{ backgroundColor: "#060606", color: "#ffffff", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", fontFamily: "'Inter', sans-serif", gap: "15px" }}>
        <p style={{ color: "#ff3333", fontWeight: "600" }}>⚠️ Hệ thống không tìm thấy nội dung phim này hoặc API đang bảo trì!</p>
        <button onClick={() => router.push("/")} style={{ backgroundColor: "#8a3ffc", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "4px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
          Quay lại trang chủ Meephim
        </button>
      </div>
    );
  }

  const currentTabEpisodes = getEpisodesByServerTab(activeServerTab);
  const currentTabType = getPlayerTypeByTab(activeServerTab);

  return (
    <div style={{ backgroundColor: "#060606", color: "#cccccc", fontFamily: "'Inter', sans-serif", minHeight: "100vh", fontSize: "14px", WebkitFontSmoothing: "antialiased", zoom: 1.12 }}>
      
      {/* THANH CUỘN NỘI BỘ CUSTOM */}
      <style dangerouslySetInnerHTML={{__html: `
        .episode-scroll-container::-webkit-scrollbar {
          width: 6px;
        }
        .episode-scroll-container::-webkit-scrollbar-track {
          background: #111111;
          border-radius: 4px;
        }
        .episode-scroll-container::-webkit-scrollbar-thumb {
          background: #333333;
          border-radius: 4px;
        }
        .episode-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #8a3ffc;
        }
      `}} />

      {/* HEADER MENU - ĐÃ KHÔI PHỤC LOGO ẢNH CHUẨN */}
      <header style={{ backgroundColor: "#000000", padding: "10px 50px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999, borderBottom: "1px solid #1a1525" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
          
          {/* KHU VỰC LOGO BẰNG FILE ẢNH THEO ĐÚNG THIẾT KẾ CỦA BẠN */}
          <div onClick={() => router.push("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
            <Image 
              src="/logo.png" 
              alt="Meephim Logo" 
              width={82}
              height={62} 
              priority
              style={{ objectFit: "contain" }}
            />
          </div>
          
          <nav style={{ display: "flex", gap: "20px", fontSize: "13px", fontWeight: "600", color: "#b3b3b3" }}>
            <span onClick={() => router.push("/")} style={{ cursor: "pointer" }}>Trang Chủ</span>
            <span onClick={() => router.push("/?type=phim-le")} style={{ cursor: "pointer" }}>Phim Lẻ</span>
            <span onClick={() => router.push("/?type=phim-bo")} style={{ cursor: "pointer" }}>Phim Bộ</span>
            
            <div style={{ position: "relative" }}>
              <span onClick={() => setActiveMenu(activeMenu === "genre" ? null : "genre")} style={{ cursor: "pointer", display: "block" }}>Thể Loại ▾</span>
              {activeMenu === "genre" && (
                <div style={{ position: "absolute", top: "25px", left: 0, backgroundColor: "#0f0f0f", border: "1px solid #222", padding: "10px", borderRadius: "4px", width: "160px", display: "grid", gridTemplateColumns: "1fr", gap: "8px", zIndex: 110, boxShadow: "0 10px 25px rgba(0,0,0,0.7)" }}>
                  {genres.map((g) => (
                    <span key={g._id} onClick={() => router.push(`/?genre=${g.slug}`)} style={{ cursor: "pointer", color: "#cccccc", fontSize: "13px", padding: "2px 4px" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8a3ffc"} onMouseLeave={(e) => e.currentTarget.style.color = "#cccccc"}>{g.name}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <span onClick={() => setActiveMenu(activeMenu === "country" ? null : "country")} style={{ cursor: "pointer", display: "block" }}>Quốc Gia ▾</span>
              {activeMenu === "country" && (
                <div style={{ position: "absolute", top: "25px", left: 0, backgroundColor: "#0f0f0f", border: "1px solid #222", padding: "10px", borderRadius: "4px", width: "160px", display: "grid", gridTemplateColumns: "1fr", gap: "8px", zIndex: 110, boxShadow: "0 10px 25px rgba(0,0,0,0.7)" }}>
                  {countries.map((c) => (
                    <span key={c._id} onClick={() => router.push(`/?country=${c.slug}`)} style={{ cursor: "pointer", color: "#cccccc", fontSize: "13px", padding: "2px 4px" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8a3ffc"} onMouseLeave={(e) => e.currentTarget.style.color = "#cccccc"}>{c.name}</span>
                  ))}
                </div>
              )}
            </div>

            <span onClick={() => router.push("/?type=phim-chieu-rap")} style={{ cursor: "pointer" }}>Phim Chiếu Rạp</span>
          </nav>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <input type="text" placeholder="Tìm phim..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} onKeyDown={handleSearch} style={{ backgroundColor: "#141414", border: "1px solid #251e36", color: "#ffffff", padding: "8px 18px", borderRadius: "20px", fontSize: "12px", width: "220px", outline: "none" }} />
        </div>
      </header>

      {/* BACKGROUND BANNER */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "450px", backgroundImage: `linear-gradient(to bottom, rgba(6,6,6,0.2) 0%, rgba(6,6,6,0.95) 100%), url(${getCleanImageUrl(movie.thumb_url || movie.poster_url)})`, backgroundSize: "cover", backgroundPosition: "center top", opacity: 0.25, zIndex: 0, filter: "blur(4px)" }}></div>

      {/* CONTAINER CHÍNH */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "115px 20px 40px 20px", position: "relative", zIndex: 1 }}>
        
        {/* KHỐI HIỂN THỊ CHI TIẾT PHIM */}
        <section style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "40px", backgroundColor: "rgba(10, 10, 10, 0.85)", padding: "35px", borderRadius: "12px", border: "1px solid #151122", backdropFilter: "blur(10px)", marginBottom: "30px" }}>
          <div>
            <div style={{ width: "100%", height: "370px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#111", boxShadow: "0 8px 25px rgba(0,0,0,0.7)", border: "1px solid #222" }}>
              <img src={getCleanImageUrl(movie.poster_url || movie.thumb_url)} alt={movie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
              <div style={{ backgroundColor: "#141414", padding: "10px", borderRadius: "4px", textAlign: "center", fontSize: "13px", color: "#aaa" }}>
                Trạng thái: <span style={{ color: "#00f5d4", fontWeight: "600" }}>{movie.episode_current}</span>
              </div>
              <div style={{ backgroundColor: "#141414", padding: "10px", borderRadius: "4px", textAlign: "center", fontSize: "13px", color: "#aaa" }}>
                Định dạng: <span style={{ color: "#8a3ffc", fontWeight: "600" }}>{movie.quality} - {movie.lang}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "11px", backgroundColor: "#8a3ffc", color: "#fff", padding: "3px 8px", borderRadius: "4px", fontWeight: "700", textTransform: "uppercase" }}>MeePhim VIP</span>
              <h1 style={{ fontSize: "28px", color: "#ffffff", margin: "10px 0 5px 0", fontWeight: "800" }}>{movie.name}</h1>
              <h2 style={{ fontSize: "16px", color: "#888888", margin: "0 0 25px 0", fontWeight: "500", fontStyle: "italic" }}>{movie.origin_name} ({movie.year})</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 40px", borderBottom: "1px solid #222", paddingBottom: "25px", marginBottom: "25px", fontSize: "13.5px" }}>
                <div><span style={{ color: "#666666", marginRight: "8px" }}>Thời lượng:</span> <span style={{ color: "#dddddd" }}>{movie.time || "N/A"}</span></div>
                <div><span style={{ color: "#666666", marginRight: "8px" }}>Năm phát hành:</span> <span style={{ color: "#dddddd" }}>{movie.year}</span></div>
                <div><span style={{ color: "#666666", marginRight: "8px" }}>Quốc gia:</span> <span style={{ color: "#dddddd" }}>{movie.country?.map((c) => c.name).join(", ") || "N/A"}</span></div>
                <div><span style={{ color: "#666666", marginRight: "8px" }}>Thể loại:</span> <span style={{ color: "#dddddd" }}>{movie.category?.map((cat) => cat.name).join(", ") || "N/A"}</span></div>
                
                {/* BỔ SUNG THÔNG TIN ĐẠO DIỄN VÀ DIỄN VIÊN ĐỂ LẤP ĐẦY KHOẢNG TRỐNG */}
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ color: "#666666", marginRight: "8px" }}>Đạo diễn:</span> 
                  <span style={{ color: "#dddddd" }}>
                    {movie.director && movie.director.length > 0 && movie.director[0] !== "" ? movie.director.join(", ") : "Đang cập nhật"}
                  </span>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ color: "#666666", marginRight: "8px" }}>Diễn viên:</span> 
                  <span style={{ color: "#dddddd", lineHeight: "1.5" }}>
                    {movie.actor && movie.actor.length > 0 && movie.actor[0] !== "" ? movie.actor.join(", ") : "Đang cập nhật"}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: "rgba(0,0,0,0.3)", padding: "20px", borderRadius: "6px", border: "1px solid #1a1a1a" }}>
              <h3 style={{ fontSize: "14px", color: "#ffffff", margin: "0 0 10px 0", textTransform: "uppercase", fontWeight: "700" }}>Tóm tắt nội dung</h3>
              <p style={{ color: "#aaaaaa", lineHeight: "1.7", fontSize: "13.5px", margin: 0, textAlign: "justify" }} dangerouslySetInnerHTML={{ __html: movie.content || "Nội dung phim đang được cập nhật..." }} />
            </div>
          </div>
        </section>

        {/* KHỐI TRÌNH PHÁT VIDEO PLAYER */}
        <div ref={playerRef}>
          {showPlayer && (
            <section style={{ marginBottom: "30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "4px", height: "16px", backgroundColor: "#8a3ffc", borderRadius: "2px" }}></span>
                  <span style={{ fontSize: "15px", fontWeight: "600", color: "#ffffff" }}>
                    Đang phát: Tập {currentEpisodeName} (SERVER {activeServerTab})
                  </span>
                </div>
              </div>
              
              <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", backgroundColor: "#000000", borderRadius: "8px", overflow: "hidden", border: "1px solid #1a142e" }}>
                {playerType === "embed" ? (
                  <iframe src={currentLink} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allowFullScreen scrolling="no" />
                ) : (
                  <iframe src={`https://imbed.xyz/player/?url=${encodeURIComponent(currentBackupLink)}`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allowFullScreen scrolling="no" />
                )}
              </div>
            </section>
          )}
        </div>

        {/* KHU VỰC CHỌN SERVER VÀ HIỂN THỊ TẬP PHIM */}
        {servers.length > 0 && (
          <section style={{ backgroundColor: "#0d0d0d", padding: "25px", borderRadius: "8px", border: "1px solid #1a1a1a", marginBottom: "30px" }}>
            <h2 style={{ fontSize: "15px", color: "#ffffff", margin: "0 0 15px 0", fontWeight: "600" }}>
              Chọn Server Xem Phim:
            </h2>

            {/* HÀNG NÚT CHỌN SERVER */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px", borderBottom: "1px solid #222", paddingBottom: "18px" }}>
              {[
                { id: 1, name: "SERVER 1 (VIETSUB)" },
                { id: 2, name: "SERVER 2 (VIETSUB)" },
                { id: 3, name: "SERVER 3 (LỒNG TIẾNG)" },
                { id: 4, name: "SERVER 4 (LỒNG TIẾNG)" }
              ].map((srv) => {
                const isSelected = activeServerTab === srv.id;
                return (
                  <button
                    key={srv.id}
                    onClick={() => setActiveServerTab(srv.id)}
                    style={{
                      backgroundColor: isSelected ? "#8a3ffc" : "#1a1a1a",
                      color: isSelected ? "#ffffff" : "#aaaaaa",
                      border: isSelected ? "1px solid #a873ff" : "1px solid #333",
                      padding: "10px 20px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "700",
                      transition: "all 0.2s ease",
                      boxShadow: isSelected ? "0 4px 15px rgba(138, 63, 252, 0.4)" : "none"
                    }}
                  >
                    {srv.name}
                  </button>
                );
              })}
            </div>

            {/* KHU VỰC GIỚI HẠN CHIỀU CAO NÚT TẬP VÀ THANH CUỘN NỘI BỘ */}
            <div 
              className="episode-scroll-container"
              style={{ 
                maxHeight: "220px",        
                overflowY: "auto",          
                paddingRight: "8px"         
              }}
            >
              {currentTabEpisodes.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(85px, 1fr))", gap: "10px" }}>
                  {currentTabEpisodes.map((ep) => {
                    const isActived = showPlayer && playerType === currentTabType && ep.name === currentEpisodeName;
                    return (
                      <button
                        key={`${activeServerTab}-${ep.slug}`}
                        onClick={() => handleSelectEpisode(ep, currentTabType, activeServerTab)}
                        style={{
                          backgroundColor: isActived ? (currentTabType === "embed" ? "#00b46e" : "#ff9900") : "#1c1e22",
                          color: isActived ? "#ffffff" : "#dddddd",
                          border: "none",
                          padding: "11px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "600",
                          textAlign: "center",
                          transition: "all 0.15s ease"
                        }}
                      >
                        Tập {ep.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: "#666", fontSize: "13.5px", fontStyle: "italic", padding: "10px 0" }}>
                  Nguồn phim này hiện tại chưa cập nhật tập mới, vui lòng chọn Server khác!
                </div>
              )}
            </div>

          </section>
        )}

        {/* KHU VỰC BÌNH LUẬN */}
        <section style={{ backgroundColor: "#0d0d0d", padding: "25px", borderRadius: "8px", border: "1px solid #1a1a1a", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", color: "#ffffff", margin: "0 0 20px 0", fontWeight: "600" }}>Bình luận (0)</h2>
          <div style={{ display: "flex", gap: "15px", alignItems: "flex-start" }}>
            <textarea 
              placeholder="Tham gia cuộc thảo luận..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ flex: 1, height: "70px", backgroundColor: "#141414", border: "1px solid #222", borderRadius: "6px", color: "#fff", padding: "12px", fontSize: "13.5px", outline: "none", resize: "none" }}
            />
          </div>
        </section>

        {/* KHU VỰC PHIM ĐỀ XUẤT */}
        {relatedMovies.length > 0 && (
          <section style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "17px", color: "#ffffff", fontWeight: "700" }}>Có thể bạn cũng thích</h2>
            </div>
            <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "15px", scrollbarWidth: "none" }}>
              {relatedMovies.map((item) => (
                <div key={item._id} onClick={() => router.push(`/movie/${item.slug}`)} style={{ minWidth: "142px", width: "142px", cursor: "pointer" }}>
                  <div style={{ position: "relative", width: "100%", height: "210px", borderRadius: "6px", overflow: "hidden", backgroundColor: "#111" }}>
                    <img src={getCleanImageUrl(item.poster_url || item.thumb_url)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <h3 style={{ fontSize: "13px", color: "#fff", margin: "8px 0 2px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</h3>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* FOOTER */}
      <footer style={{ backgroundColor: "#000000", borderTop: "1px solid #14111f", padding: "35px 0", textAlign: "center", fontSize: "12px", color: "#666666", marginTop: "40px" }}>
        <p style={{ margin: 0 }}>© 2026 Meephim - Hệ thống xem phim trực tuyến tối ưu hóa dữ liệu.</p>
      </footer>

    </div>
  );
}