"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Movie {
  _id: string;
  name: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  slug: string;
  year: number;
  episode_current?: string;
}

interface FilterItem {
  _id: string;
  name: string;
  slug: string;
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Lấy các tham số từ URL query
  const typeParam = searchParams.get("type");
  const genreParam = searchParams.get("genre");
  const countryParam = searchParams.get("country");
  const yearParam = searchParams.get("year");
  const searchParam = searchParams.get("search");

  const [moviesUpdated, setMoviesUpdated] = useState<Movie[]>([]); 
  const [moviesCinema, setMoviesCinema] = useState<Movie[]>([]);   
  const [moviesSeries, setMoviesSeries] = useState<Movie[]>([]);   
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]); 
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]); 
  
  const [searchMovies, setSearchMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [titlePage, setTitlePage] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isHome, setIsHome] = useState(true);

  const [genres, setGenres] = useState<FilterItem[]>([]);
  const [countries, setCountries] = useState<FilterItem[]>([]);
  const years = ["2026", "2025", "2024", "2023", "2022"];
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

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

  // Hàm điều hướng chung - Reset sạch dữ liệu cũ tránh lỗi kẹt giao diện khi bấm nút
  const handleMenuClick = (url: string) => {
    setLoading(true);
    setSearchMovies([]);
    setActiveMenu(null);
    router.push(url);
  };

  const loadHomeData = async () => {
    try {
      const [resUpdated, resCinema, resSeries] = await Promise.all([
        fetch("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=1"),
        fetch("https://phimapi.com/v1/api/danh-sach/phim-chieu-rap?limit=10&sort_field=modified.time&sort_type=desc"),
        fetch("https://phimapi.com/v1/api/danh-sach/phim-bo?limit=10&sort_field=modified.time&sort_type=desc")
      ]);

      const dataUpdated = await resUpdated.json();
      const dataCinema = await resCinema.json();
      const dataSeries = await resSeries.json();

      if (dataUpdated?.items) setMoviesUpdated(dataUpdated.items.slice(0, 5));
      
      const cinemaItems = dataCinema?.data?.items || dataCinema?.items || [];
      setMoviesCinema(cinemaItems.slice(0, 10)); 
      setFeaturedMovies(cinemaItems.slice(0, 8)); 
      
      const seriesItems = dataSeries?.data?.items || dataSeries?.items || [];
      setMoviesSeries(seriesItems.slice(0, 10));
      
      if (seriesItems.length > 0) {
        setTopRatedMovies(seriesItems.slice(2, 8));
      }
    } catch (error) {
      console.error("Lỗi fetch API trang chủ:", error);
    }
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

  const handleRoutingFilters = async () => {
    setLoading(true);
    let apiUrl = "";
    let pageTitle = "";

    if (typeParam === "phim-le") {
      apiUrl = "https://phimapi.com/v1/api/danh-sach/phim-le?limit=24&sort_field=modified.time&sort_type=desc";
      pageTitle = "Danh Sách Phim Lẻ";
    } else if (typeParam === "phim-bo") {
      apiUrl = "https://phimapi.com/v1/api/danh-sach/phim-bo?limit=24&sort_field=modified.time&sort_type=desc";
      pageTitle = "Danh Sách Phim Bộ";
    } else if (typeParam === "phim-chieu-rap") {
      apiUrl = "https://phimapi.com/v1/api/danh-sach/phim-chieu-rap?limit=24";
      pageTitle = "Phim Chiếu Rạp Mới Nhất";
    } else if (typeParam === "thuyet-minh") {
      apiUrl = "https://phimapi.com/v1/api/danh-sach/phim-bo?sort_lang=thuyet-minh&limit=24";
      pageTitle = "Phim Thuyết Minh Chọn Lọc";
    } else if (genreParam) {
      apiUrl = `https://phimapi.com/v1/api/the-loai/${genreParam}?limit=24`;
      const matchedGenre = genres.find(g => g.slug === genreParam);
      pageTitle = `Thể loại: ${matchedGenre ? matchedGenre.name : genreParam}`;
    } else if (countryParam) {
      apiUrl = `https://phimapi.com/v1/api/quoc-gia/${countryParam}?limit=24`;
      const matchedCountry = countries.find(c => c.slug === countryParam);
      pageTitle = `Quốc gia: ${matchedCountry ? matchedCountry.name : countryParam}`;
    } else if (yearParam) {
      apiUrl = `https://phimapi.com/v1/api/nam/${yearParam}?limit=24`;
      pageTitle = `Phim năm phát hành: ${yearParam}`;
    } else if (searchParam) {
      apiUrl = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(searchParam)}&limit=24`;
      pageTitle = `Kết quả tìm kiếm: "${searchParam}"`;
      setSearchKeyword(searchParam);
    }

    if (apiUrl) {
      try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        const items = data?.data?.items || data?.items || [];
        setSearchMovies(items);
        setIsHome(false);
        setTitlePage(pageTitle);
      } catch (error) {
        console.error("Lỗi lọc phim từ URL:", error);
      }
    } else {
      setIsHome(true);
      await loadHomeData();
    }
    setLoading(false);
  };

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // HỆ THỐNG GHI ĐÈ CSS ĐỘC LẬP - BẤT CHẤP MỌI LOẠI THIẾT BỊ VÀ NÚT BẤM
    const style = document.createElement("style");
    style.innerHTML = `
      .header-desktop-nav { display: flex !important; }
      .mobile-search-wrapper { display: none !important; }
      .movie-grid-chunk { display: grid; grid-template-columns: 1.25fr 1fr 1fr; gap: 15px; margin-bottom: 25px; }
      .movie-grid-chunk.reversed { grid-template-columns: 1fr 1fr 1.25fr; }
      .featured-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 12px; }
      .main-layout { display: grid; grid-template-columns: 1fr 310px; gap: 30px; }
      .search-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
      
      @media (max-width: 1024px) {
        .main-layout { grid-template-columns: 1fr; }
        .featured-grid { grid-template-columns: repeat(4, 1fr); }
        .search-grid { grid-template-columns: repeat(3, 1fr); }
      }

      @media (max-width: 768px) {
        .header-desktop-nav { display: none !important; }
        
        header {
          background-color: rgba(0, 0, 0, 0.9) !important;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 10px 15px !important;
          height: 60px !important;
        }

        .main-content-wrapper {
          padding-top: 75px !important;
        }

        .mobile-search-wrapper {
          display: flex !important;
          margin-bottom: 15px;
          padding: 0 5px;
        }
        .mobile-search-wrapper input {
          background-color: #121212 !important;
          border: 1px solid #222222 !important;
          color: #ffffff !important;
          padding: 10px 16px !important;
          border-radius: 20px !important;
          font-size: 13px !important;
          width: 100%;
          outline: none;
        }

        /* TRANG CHỦ: ÉP PHẲNG LƯỚI 2 CỘT */
        .movie-grid-chunk, .movie-grid-chunk.reversed {
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 12px !important;
          margin-bottom: 15px !important;
        }

        /* KHÓA CHẾT TỶ LỆ BANNER KHUNG POSTER TRANG CHỦ */
        .big-movie-item, .small-movie-item {
          grid-row: span 1 !important;
          height: auto !important; 
          aspect-ratio: 2 / 3 !important;
        }
        .big-movie-item img, .small-movie-item img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }

        .big-movie-item h3, .small-movie-item h4 {
          font-size: 12px !important;
          font-weight: 600 !important;
          margin: 0 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          line-height: 1.4 !important;
        }
        .big-movie-item p { display: none !important; } 
        .big-movie-item > div {
          padding: 10px 8px !important;
          background: linear-gradient(transparent, rgba(0,0,0,0.95)) !important;
        }

        /* SỬA TRIỆT ĐỂ: TRANG TÌM KIẾM & PHIM LẺ / THỂ LOẠI / QUỐC GIA */
        .search-grid { 
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important; 
          gap: 12px !important; 
        }
        
        .search-movie-image-holder { 
          height: auto !important; 
          aspect-ratio: 2 / 3 !important; 
          width: 100% !important;
        }
        
        .search-movie-image-holder img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }

        .search-grid h3 {
          font-size: 12px !important;
          font-weight: 600 !important;
          margin: 6px 0 2px 0 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .search-grid p {
          font-size: 11px !important;
          margin: 0 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        /* Slider đề cử hàng ngang cuộn tròn trịa */
        .featured-grid {
          display: flex !important;
          overflow-x: auto !important;
          gap: 10px !important;
          padding-bottom: 8px !important;
          scrollbar-width: none;
        }
        .featured-grid::-webkit-scrollbar { display: none; }
        .featured-grid > div {
          flex: 0 0 calc(33.333% - 7px) !important;
        }
        .featured-grid > div > div {
          height: auto !important;
          aspect-ratio: 2 / 3 !important;
        }
      }

      @media (max-width: 480px) {
        .featured-grid > div { flex: 0 0 calc(36% - 7px) !important; }
      }
    `;
    document.head.appendChild(style);

    loadMenuFilters();
  }, []);

  useEffect(() => {
    handleRoutingFilters();
  }, [typeParam, genreParam, countryParam, yearParam, searchParam, genres.length, countries.length]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchKeyword.trim() !== "") {
      handleMenuClick(`/?search=${encodeURIComponent(searchKeyword.trim())}`);
    }
  };

  const handleGoHome = () => {
    setSearchKeyword("");
    handleMenuClick("/");
  };

  if (loading && moviesUpdated.length === 0) {
    return (
      <div style={{ backgroundColor: "#060606", color: "#8a3ffc", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "'Inter', sans-serif", fontWeight: "600", fontSize: "14px" }}>
        ĐANG KHỞI TẠO NGUỒN PHIM MEEPHIM... VUI LÒNG CHỜ GIÂY LÁT!
      </div>
    );
  }

  // RENDER TRANG CHỦ (MAPPED CHUNK)
  const renderMovieChunk = (moviesList: Movie[], startIndex: number, isReversed: boolean) => {
    const chunk = moviesList.slice(startIndex, startIndex + 5);
    if (chunk.length === 0) return null;

    const bigMovie = chunk[0];
    const smallMovies = chunk.slice(1, 5);

    return (
      <div className={`movie-grid-chunk ${isReversed ? "reversed" : ""}`}>
        {isReversed && smallMovies.slice(0, 2).map((movie) => (
          <div key={movie._id} onClick={() => router.push(`/movie/${movie.slug}`)} className="small-movie-item" style={{ position: "relative", cursor: "pointer", borderRadius: "6px", overflow: "hidden", height: "158px", backgroundColor: "#111", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
            <img src={getCleanImageUrl(movie.thumb_url || movie.poster_url)} alt={movie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.95))", padding: "12px 10px" }}>
              <h4 style={{ fontSize: "12px", color: "#ffffff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: "600" }}>{movie.name}</h4>
            </div>
          </div>
        ))}

        {bigMovie && (
          <div onClick={() => router.push(`/movie/${bigMovie.slug}`)} className="big-movie-item" style={{ gridRow: "span 2", position: "relative", cursor: "pointer", borderRadius: "6px", overflow: "hidden", height: "331px", boxShadow: "0 6px 20px rgba(0,0,0,0.6)" }}>
            <img src={getCleanImageUrl(bigMovie.poster_url || bigMovie.thumb_url)} alt={bigMovie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 65%, transparent 100%)", padding: "18px 15px" }}>
              <h3 style={{ fontSize: "15px", color: "#ffffff", margin: "8px 0 3px 0", fontWeight: "700", letterSpacing: "0.3px" }}>{bigMovie.name}</h3>
              <p style={{ fontSize: "12px", color: "#cccccc", margin: 0 }}>{bigMovie.origin_name}</p>
            </div>
          </div>
        )}

        {!isReversed ? (
          smallMovies.map((movie) => (
            <div key={movie._id} onClick={() => router.push(`/movie/${movie.slug}`)} className="small-movie-item" style={{ position: "relative", cursor: "pointer", borderRadius: "6px", overflow: "hidden", height: "158px", backgroundColor: "#111", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
              <img src={getCleanImageUrl(movie.thumb_url || movie.poster_url)} alt={movie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.95))", padding: "12px 10px" }}>
                <h4 style={{ fontSize: "12px", color: "#ffffff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: "600" }}>{movie.name}</h4>
              </div>
            </div>
          ))
        ) : (
          smallMovies.slice(2, 4).map((movie) => (
            <div key={movie._id} onClick={() => router.push(`/movie/${movie.slug}`)} className="small-movie-item" style={{ position: "relative", cursor: "pointer", borderRadius: "6px", overflow: "hidden", height: "158px", backgroundColor: "#111", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
              <img src={getCleanImageUrl(movie.thumb_url || movie.poster_url)} alt={movie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.95))", padding: "12px 10px" }}>
                <h4 style={{ fontSize: "12px", color: "#ffffff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: "600" }}>{movie.name}</h4>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: "#060606", color: "#cccccc", fontFamily: "'Inter', sans-serif", minHeight: "100vh", fontSize: "14px", WebkitFontSmoothing: "antialiased" }}>
      
      {/* HEADER NAVBAR ĐÃ SỬA HẾT CÁC NÚT BẤM CHUYỂN TAB */}
      <header style={{ backgroundColor: "#000000", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999, borderBottom: "1px solid #141414", height: "65px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", width: "100%", justifyContent: "space-between" }}>
          
          <div onClick={handleGoHome} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
            <img 
              src="/logo.png" 
              alt="Meephim Logo" 
              style={{ height: "35px", width: "auto", objectFit: "contain" }} 
              onError={(e) => {
                e.currentTarget.style.display = "none";
                if(e.currentTarget.nextSibling) {
                  (e.currentTarget.nextSibling as HTMLElement).style.display = "block";
                }
              }}
            />
            <div style={{ display: "none", fontSize: "22px", fontWeight: "700", color: "#ffffff", letterSpacing: "-0.5px" }}>
              mee<span style={{ color: "#8a3ffc" }}>phim</span>
            </div>
          </div>
          
          <nav className="header-desktop-nav" style={{ display: "flex", gap: "20px", fontSize: "13px", fontWeight: "600", color: "#b3b3b3", alignItems: "center" }}>
            <span onClick={() => handleMenuClick("/?type=phim-le")} style={{ cursor: "pointer", color: typeParam === "phim-le" ? "#8a3ffc" : "#b3b3b3" }}>Phim Lẻ</span>
            <span onClick={() => handleMenuClick("/?type=phim-bo")} style={{ cursor: "pointer", color: typeParam === "phim-bo" ? "#8a3ffc" : "#b3b3b3" }}>Phim Bộ</span>
            
            <div style={{ position: "relative" }}>
              <span onClick={() => setActiveMenu(activeMenu === "genre" ? null : "genre")} style={{ cursor: "pointer", color: genreParam ? "#8a3ffc" : "#b3b3b3", display: "block" }}>Thể Loại ▾</span>
              {activeMenu === "genre" && (
                <div style={{ position: "absolute", top: "25px", left: 0, backgroundColor: "#0f0f0f", border: "1px solid #222", padding: "10px", borderRadius: "4px", width: "160px", display: "grid", gridTemplateColumns: "1fr", gap: "8px", zIndex: 110, boxShadow: "0 10px 25px rgba(0,0,0,0.7)" }}>
                  {genres.map((g) => (
                    <span key={g._id} onClick={() => handleMenuClick(`/?genre=${g.slug}`)} style={{ cursor: "pointer", color: genreParam === g.slug ? "#8a3ffc" : "#cccccc", fontSize: "13px", padding: "2px 4px", borderRadius: "2px" }}>{g.name}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <span onClick={() => setActiveMenu(activeMenu === "country" ? null : "country")} style={{ cursor: "pointer", color: countryParam ? "#8a3ffc" : "#b3b3b3", display: "block" }}>Quốc Gia ▾</span>
              {activeMenu === "country" && (
                <div style={{ position: "absolute", top: "25px", left: 0, backgroundColor: "#0f0f0f", border: "1px solid #222", padding: "10px", borderRadius: "4px", width: "160px", display: "grid", gridTemplateColumns: "1fr", gap: "8px", zIndex: 110, boxShadow: "0 10px 25px rgba(0,0,0,0.7)" }}>
                  {countries.map((c) => (
                    <span key={c._id} onClick={() => handleMenuClick(`/?country=${c.slug}`)} style={{ cursor: "pointer", color: countryParam === c.slug ? "#8a3ffc" : "#cccccc", fontSize: "13px", padding: "2px 4px", borderRadius: "2px" }}>{c.name}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <span onClick={() => setActiveMenu(activeMenu === "year" ? null : "year")} style={{ cursor: "pointer", color: yearParam ? "#8a3ffc" : "#b3b3b3", display: "block" }}>Năm Phát Hành ▾</span>
              {activeMenu === "year" && (
                <div style={{ position: "absolute", top: "25px", left: 0, backgroundColor: "#0f0f0f", border: "1px solid #222", padding: "10px", borderRadius: "4px", width: "110px", display: "flex", flexDirection: "column", gap: "8px", zIndex: 110, boxShadow: "0 10px 25px rgba(0,0,0,0.7)" }}>
                  {years.map((y) => (
                    <span key={y} onClick={() => handleMenuClick(`/?year=${y}`)} style={{ cursor: "pointer", color: yearParam === y ? "#8a3ffc" : "#cccccc", fontSize: "13px", padding: "2px 4px" }}>Năm {y}</span>
                  ))}
                </div>
              )}
            </div>

            <span onClick={() => handleMenuClick("/?type=phim-chieu-rap")} style={{ cursor: "pointer", color: typeParam === "phim-chieu-rap" ? "#8a3ffc" : "#b3b3b3" }}>Phim Chiếu Rạp</span>
            <span onClick={() => handleMenuClick("/?type=thuyet-minh")} style={{ cursor: "pointer", color: typeParam === "thuyet-minh" ? "#8a3ffc" : "#b3b3b3" }}>Phim Thuyết Minh</span>
          </nav>

          <div className="header-desktop-nav" style={{ alignItems: "center", gap: "15px" }}>
            <input 
              type="text" 
              placeholder="Tìm phim + ấn Enter..." 
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={handleSearch}
              style={{ backgroundColor: "#141414", border: "1px solid #251e36", color: "#ffffff", padding: "8px 18px", borderRadius: "20px", fontSize: "12px", width: "200px", outline: "none" }}
            />
            <span style={{ color: "#ffffff", fontSize: "13px", cursor: "pointer", fontWeight: "500", whiteSpace: "nowrap" }}>👤 Đăng nhập</span>
          </div>

          <div style={{ display: "none", cursor: "pointer", fontSize: "18px" }} className="mobile-search-wrapper" onClick={handleGoHome}>
            🏠
          </div>

        </div>
      </header>

      {/* KHUNG WRAPPER CHỨA NỘI DUNG CHÍNH */}
      <div className="main-content-wrapper" style={{ maxWidth: "1280px", margin: "0 auto", padding: "85px 15px 25px 15px" }}>
        
        {/* THANH TÌM KIẾM CHO MOBILE */}
        <div className="mobile-search-wrapper">
          <input 
            type="text" 
            placeholder="Tìm kiếm phim tại Meephim..." 
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>

        {/* BANNER ĐỀ CỬ */}
        {isHome && featuredMovies.length > 0 && (
          <section style={{ marginBottom: "30px" }} className="featured-section-box">
            <h2 style={{ fontSize: "15px", color: "#ffffff", textTransform: "uppercase", borderLeft: "3px solid #8a3ffc", paddingLeft: "10px", marginBottom: "15px", fontWeight: "700", letterSpacing: "0.5px" }}>
              Meephim Đề Cử Chọn Lọc
            </h2>
            <div className="featured-grid">
              {featuredMovies.slice(0, 8).map((movie) => (
                <div key={movie._id} onClick={() => router.push(`/movie/${movie.slug}`)} style={{ cursor: "pointer" }}>
                  <div style={{ position: "relative", width: "100%", height: "165px", borderRadius: "5px", overflow: "hidden", backgroundColor: "#111111" }}>
                    <img src={getCleanImageUrl(movie.poster_url || movie.thumb_url)} alt={movie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  </div>
                  <h3 style={{ fontSize: "12px", margin: "6px 0 2px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#ffffff", fontWeight: "600" }}>{movie.name}</h3>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* HAI CỘT PHIM */}
        <div className="main-layout">
          
          <main style={{ minWidth: 0 }}>
            {isHome ? (
              <div>
                <div style={{ marginBottom: "15px" }}>
                  <h2 style={{ fontSize: "16px", color: "#8a3ffc", textTransform: "uppercase", fontWeight: "700", margin: "0 0 18px 0" }}>
                    Phim Mới Cập Nhật
                  </h2>
                </div>
                {renderMovieChunk(moviesUpdated, 0, false)}

                <div style={{ marginTop: "35px", marginBottom: "15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1a1a1a", paddingBottom: "8px", marginBottom: "18px" }}>
                    <h2 style={{ fontSize: "16px", color: "#ffffff", textTransform: "uppercase", fontWeight: "700", margin: 0 }}>
                      Phim Chiếu Rạp Mới
                    </h2>
                    <span onClick={() => handleMenuClick("/?type=phim-chieu-rap")} style={{ color: "#8a3ffc", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>Xem tất cả ›</span>
                  </div>
                </div>
                {renderMovieChunk(moviesCinema, 0, false)}
                {renderMovieChunk(moviesCinema, 5, true)}

                <div style={{ marginTop: "35px", marginBottom: "15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1a1a1a", paddingBottom: "8px", marginBottom: "18px" }}>
                    <h2 style={{ fontSize: "16px", color: "#ffffff", textTransform: "uppercase", fontWeight: "700", margin: 0 }}>
                      Phim Bộ Mới
                    </h2>
                    <span onClick={() => handleMenuClick("/?type=phim-bo")} style={{ color: "#8a3ffc", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>Xem tất cả ›</span>
                  </div>
                </div>
                {renderMovieChunk(moviesSeries, 0, false)}
                {renderMovieChunk(moviesSeries, 5, true)}
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #222", paddingBottom: "12px", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "16px", color: "#8a3ffc", textTransform: "uppercase", margin: 0, fontWeight: "700" }}>{titlePage}</h2>
                  <span onClick={handleGoHome} style={{ color: "#8a3ffc", fontSize: "12px", cursor: "pointer", fontWeight: "700" }}>← Quay lại</span>
                </div>
                
                {/* LƯỚI KẾT QUẢ TÌM KIẾM / BỘ LỌC ĐÃ PHẲNG TUYỆT ĐỐI */}
                <div className="search-grid">
                  {searchMovies.length > 0 ? (
                    searchMovies.map((movie) => (
                      <div key={movie._id} onClick={() => router.push(`/movie/${movie.slug}`)} style={{ cursor: "pointer", marginBottom: "15px" }}>
                        
                        <div className="search-movie-image-holder">
                          <img 
                            src={getCleanImageUrl(movie.poster_url || movie.thumb_url)} 
                            alt={movie.name} 
                            loading="lazy" 
                          />
                        </div>
                        
                        <h3>{movie.name}</h3>
                        <p style={{ color: "#aaaaaa" }}>{movie.origin_name}</p>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#999999", gridColumn: "1 / -1", textAlign: "center", padding: "40px 0", fontSize: "14px" }}>Không tìm thấy phim phù hợp theo bộ lọc này từ API.</div>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* SIDEBAR BÊN PHẢI */}
          <aside style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: "14px", color: "#8a3ffc", textTransform: "uppercase", marginBottom: "15px", fontWeight: "700", borderBottom: "1px solid #1a1a1a", paddingBottom: "8px" }}>
              Phim Hot Trong Tuần
            </h2>
            <div style={{ backgroundColor: "#0b0b0b", borderRadius: "6px", border: "1px solid #141414", overflow: "hidden", marginBottom: "35px" }}>
              {moviesCinema.slice(0, 7).map((movie, index) => (
                <div key={movie._id} onClick={() => router.push(`/movie/${movie.slug}`)} style={{ display: "flex", alignItems: "center", padding: "12px 15px", borderBottom: index === 6 ? "none" : "1px solid #131313", cursor: "pointer" }}>
                  <span style={{ width: "22px", height: "22px", backgroundColor: index < 3 ? "#8a3ffc" : "#222222", color: index < 3 ? "#ffffff" : "#aaa", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "11px", fontWeight: "700", marginRight: "15px", flexShrink: 0 }}>
                    {index + 1}
                  </span>
                  <div style={{ width: "35px", height: "45px", borderRadius: "4px", overflow: "hidden", marginRight: "12px", backgroundColor: "#111", flexShrink: 0 }}>
                    <img src={getCleanImageUrl(movie.thumb_url || movie.poster_url)} alt={movie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  </div>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: "12px", color: "#ffffff", margin: "0 0 3px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: "600" }}>{movie.name}</h4>
                    <p style={{ fontSize: "13px", color: "#aaaaaa", margin: 0, fontWeight: "500" }}>{(245000 - (index * 19000)).toLocaleString()} lượt xem</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: "14px", color: "#8a3ffc", textTransform: "uppercase", marginBottom: "15px", fontWeight: "700", borderBottom: "1px solid #1a1a1a", paddingBottom: "8px" }}>
              Đánh giá cao
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {topRatedMovies.map((movie, index) => (
                <div key={movie._id} onClick={() => router.push(`/movie/${movie.slug}`)} style={{ display: "flex", gap: "12px", cursor: "pointer" }}>
                  <div style={{ width: "65px", height: "85px", borderRadius: "5px", overflow: "hidden", flexShrink: 0, backgroundColor: "#111" }}>
                    <img src={getCleanImageUrl(movie.poster_url || movie.thumb_url)} alt={movie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                    <h4 style={{ fontSize: "13px", color: "#ffffff", margin: "0 0 4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: "700" }}>{movie.name}</h4>
                    <p style={{ fontSize: "13px", color: "#aaaaaa", margin: "0 0 5px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{movie.origin_name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#cccccc" }}>
                      <span style={{ color: "#8a3ffc", fontWeight: "700" }}>⭐ {(9.5 - (index * 0.1)).toFixed(1)}</span>
                      <span>•</span>
                      <span style={{ color: "#00f5d4", fontWeight: "600" }}>Full HD</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ backgroundColor: "#000000", borderTop: "1px solid #14111f", marginTop: "80px", padding: "45px 0" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "30px", padding: "0 20px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "40px" }}>
            <div style={{ flex: "1 1 300px" }}>
              <div onClick={handleGoHome} style={{ cursor: "pointer", display: "flex", alignItems: "center", marginBottom: "15px" }}>
                <img 
                  src="/logo.png" 
                  alt="Meephim Logo" 
                  style={{ height: "40px", width: "auto", objectFit: "contain" }} 
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    if(e.currentTarget.nextSibling) {
                      (e.currentTarget.nextSibling as HTMLElement).style.display = "block";
                    }
                  }}
                />
                <div style={{ display: "none", fontSize: "24px", fontWeight: "700", color: "#ffffff", letterSpacing: "-0.5px" }}>
                  mee<span style={{ color: "#8a3ffc" }}>phim</span>
                </div>
              </div>
              <p style={{ color: "#999999", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
                Xem phim online miễn phí chất lượng cao với phụ đề Tiếng Việt, Thuyết Minh và Lồng Tiếng luôn cập nhật nhanh nhất các thể loại phim.
              </p>
            </div>
            <div>
              <h4 style={{ color: "#ffffff", fontSize: "14px", marginBottom: "14px", textTransform: "uppercase", fontWeight: "700" }}>Trợ giúp</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#999999" }}>
                <li style={{ cursor: "pointer" }}>Điều khoản sử dụng</li>
                <li style={{ cursor: "pointer" }}>Chính sách riêng tư</li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: "#ffffff", fontSize: "14px", marginBottom: "14px", textTransform: "uppercase", fontWeight: "700" }}>About</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#999999" }}>
                <li style={{ cursor: "pointer" }}>Giới thiệu dịch vụ</li>
                <li style={{ cursor: "pointer" }}>Liên hệ quảng cáo</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ color: "#8a3ffc", backgroundColor: "#060606", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>Đang tải nội dung...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
