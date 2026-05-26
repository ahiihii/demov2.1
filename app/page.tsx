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

  // Hàm xử lý gọi API dựa vào Query Parameters trên thanh URL
  const handleRoutingFilters = async () => {
    setLoading(true);
    setActiveMenu(null);
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

  // Khởi tạo menu bộ lọc trước
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    loadMenuFilters();
  }, []);

  // Mỗi khi URL thay đổi thông số query parameter, tự động gọi API lọc tương ứng
  useEffect(() => {
    handleRoutingFilters();
  }, [typeParam, genreParam, countryParam, yearParam, searchParam, genres.length, countries.length]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchKeyword.trim() !== "") {
      router.push(`/?search=${encodeURIComponent(searchKeyword.trim())}`);
    }
  };

  const handleGoHome = () => {
    setSearchKeyword("");
    router.push("/");
  };

  if (loading && moviesUpdated.length === 0) {
    return (
      <div style={{ backgroundColor: "#060606", color: "#8a3ffc", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "'Inter', sans-serif", fontWeight: "600", fontSize: "14px" }}>
        ĐANG KHỞI TẠO NGUỒN PHIM MEEPHIM... VUI LÒNG CHỜ GIÂY LÁT!
      </div>
    );
  }

  const renderMovieChunk = (moviesList: Movie[], startIndex: number, isReversed: boolean) => {
    const chunk = moviesList.slice(startIndex, startIndex + 5);
    if (chunk.length === 0) return null;

    const bigMovie = chunk[0];
    const smallMovies = chunk.slice(1, 5);
    const gridTemplate = isReversed ? "1fr 1fr 1.25fr" : "1.25fr 1fr 1fr";

    return (
      <div style={{ display: "grid", gridTemplateColumns: gridTemplate, gap: "15px", marginBottom: "25px" }}>
        {isReversed && smallMovies.slice(0, 2).map((movie) => (
          <div key={movie._id} onClick={() => router.push(`/movie/${movie.slug}`)} style={{ position: "relative", cursor: "pointer", borderRadius: "6px", overflow: "hidden", height: "158px", backgroundColor: "#111", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
            <img src={getCleanImageUrl(movie.thumb_url || movie.poster_url)} alt={movie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.95))", padding: "12px 10px" }}>
              <h4 style={{ fontSize: "12px", color: "#ffffff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: "600" }}>{movie.name}</h4>
            </div>
            <span style={{ position: "absolute", top: "8px", left: "8px", backgroundColor: "#00f5d4", color: "#000000", fontSize: "9px", fontWeight: "700", padding: "2px 5px", borderRadius: "3px" }}>HD</span>
          </div>
        ))}

        {bigMovie && (
          <div onClick={() => router.push(`/movie/${bigMovie.slug}`)} style={{ gridRow: "span 2", position: "relative", cursor: "pointer", borderRadius: "6px", overflow: "hidden", height: "331px", boxShadow: "0 6px 20px rgba(0,0,0,0.6)" }}>
            <img src={getCleanImageUrl(bigMovie.poster_url || bigMovie.thumb_url)} alt={bigMovie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 65%, transparent 100%)", padding: "18px 15px" }}>
              <span style={{ backgroundColor: "#00f5d4", color: "#000000", fontSize: "9px", fontWeight: "700", padding: "2px 5px", borderRadius: "3px" }}>HD</span>
              <h3 style={{ fontSize: "15px", color: "#ffffff", margin: "8px 0 3px 0", fontWeight: "700", letterSpacing: "0.3px" }}>{bigMovie.name}</h3>
              <p style={{ fontSize: "12px", color: "#cccccc", margin: 0 }}>{bigMovie.origin_name}</p>
            </div>
          </div>
        )}

        {!isReversed ? (
          smallMovies.map((movie) => (
            <div key={movie._id} onClick={() => router.push(`/movie/${movie.slug}`)} style={{ position: "relative", cursor: "pointer", borderRadius: "6px", overflow: "hidden", height: "158px", backgroundColor: "#111", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
              <img src={getCleanImageUrl(movie.thumb_url || movie.poster_url)} alt={movie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.95))", padding: "12px 10px" }}>
                <h4 style={{ fontSize: "12px", color: "#ffffff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: "600" }}>{movie.name}</h4>
              </div>
              <span style={{ position: "absolute", top: "8px", left: "8px", backgroundColor: "#00f5d4", color: "#000000", fontSize: "9px", fontWeight: "700", padding: "2px 5px", borderRadius: "3px" }}>HD</span>
            </div>
          ))
        ) : (
          smallMovies.slice(2, 4).map((movie) => (
            <div key={movie._id} onClick={() => router.push(`/movie/${movie.slug}`)} style={{ position: "relative", cursor: "pointer", borderRadius: "6px", overflow: "hidden", height: "158px", backgroundColor: "#111", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
              <img src={getCleanImageUrl(movie.thumb_url || movie.poster_url)} alt={movie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.95))", padding: "12px 10px" }}>
                <h4 style={{ fontSize: "12px", color: "#ffffff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: "600" }}>{movie.name}</h4>
              </div>
              <span style={{ position: "absolute", top: "8px", left: "8px", backgroundColor: "#00f5d4", color: "#000000", fontSize: "9px", fontWeight: "700", padding: "2px 5px", borderRadius: "3px" }}>HD</span>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: "#060606", color: "#cccccc", fontFamily: "'Inter', sans-serif", minHeight: "100vh", fontSize: "14px", WebkitFontSmoothing: "antialiased", zoom: 1.12 }}>
      
      {/* HEADER MENU */}
      <header style={{ backgroundColor: "#000000", padding: "10px 50px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999, borderBottom: "1px solid #1a1525" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
          
          <div onClick={handleGoHome} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
            <img 
              src="/logo.png" 
              alt="Meephim Logo" 
              style={{ height: "52.5px", width: "auto", objectFit: "contain" }} 
              onError={(e) => {
                e.currentTarget.style.display = "none";
                if(e.currentTarget.nextSibling) {
                  (e.currentTarget.nextSibling as HTMLElement).style.display = "block";
                }
              }}
            />
            <div style={{ display: "none", fontSize: "30px", fontWeight: "700", color: "#ffffff", letterSpacing: "-0.5px" }}>
              mee<span style={{ color: "#8a3ffc" }}>phim</span>
            </div>
          </div>
          
          <nav style={{ display: "flex", gap: "20px", fontSize: "13px", fontWeight: "600", color: "#b3b3b3" }}>
            <span onClick={() => router.push("/?type=phim-le")} style={{ cursor: "pointer", color: typeParam === "phim-le" ? "#8a3ffc" : "#b3b3b3" }}>Phim Lẻ</span>
            <span onClick={() => router.push("/?type=phim-bo")} style={{ cursor: "pointer", color: typeParam === "phim-bo" ? "#8a3ffc" : "#b3b3b3" }}>Phim Bộ</span>
            
            <div style={{ position: "relative" }}>
              <span onClick={() => setActiveMenu(activeMenu === "genre" ? null : "genre")} style={{ cursor: "pointer", color: genreParam ? "#8a3ffc" : "#b3b3b3", display: "block" }}>Thể Loại ▾</span>
              {activeMenu === "genre" && (
                <div style={{ position: "absolute", top: "25px", left: 0, backgroundColor: "#0f0f0f", border: "1px solid #222", padding: "10px", borderRadius: "4px", width: "160px", display: "grid", gridTemplateColumns: "1fr", gap: "8px", zIndex: 110, boxShadow: "0 10px 25px rgba(0,0,0,0.7)" }}>
                  {genres.map((g) => (
                    <span key={g._id} onClick={() => router.push(`/?genre=${g.slug}`)} style={{ cursor: "pointer", color: genreParam === g.slug ? "#8a3ffc" : "#cccccc", fontSize: "13px", padding: "2px 4px", borderRadius: "2px" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8a3ffc"} onMouseLeave={(e) => e.currentTarget.style.color = genreParam === g.slug ? "#8a3ffc" : "#cccccc"}>{g.name}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <span onClick={() => setActiveMenu(activeMenu === "country" ? null : "country")} style={{ cursor: "pointer", color: countryParam ? "#8a3ffc" : "#b3b3b3", display: "block" }}>Quốc Gia ▾</span>
              {activeMenu === "country" && (
                <div style={{ position: "absolute", top: "25px", left: 0, backgroundColor: "#0f0f0f", border: "1px solid #222", padding: "10px", borderRadius: "4px", width: "160px", display: "grid", gridTemplateColumns: "1fr", gap: "8px", zIndex: 110, boxShadow: "0 10px 25px rgba(0,0,0,0.7)" }}>
                  {countries.map((c) => (
                    <span key={c._id} onClick={() => router.push(`/?country=${c.slug}`)} style={{ cursor: "pointer", color: countryParam === c.slug ? "#8a3ffc" : "#cccccc", fontSize: "13px", padding: "2px 4px", borderRadius: "2px" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8a3ffc"} onMouseLeave={(e) => e.currentTarget.style.color = countryParam === c.slug ? "#8a3ffc" : "#cccccc"}>{c.name}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <span onClick={() => setActiveMenu(activeMenu === "year" ? null : "year")} style={{ cursor: "pointer", color: yearParam ? "#8a3ffc" : "#b3b3b3", display: "block" }}>Năm Phát Hành ▾</span>
              {activeMenu === "year" && (
                <div style={{ position: "absolute", top: "25px", left: 0, backgroundColor: "#0f0f0f", border: "1px solid #222", padding: "10px", borderRadius: "4px", width: "110px", display: "flex", flexDirection: "column", gap: "8px", zIndex: 110, boxShadow: "0 10px 25px rgba(0,0,0,0.7)" }}>
                  {years.map((y) => (
                    <span key={y} onClick={() => router.push(`/?year=${y}`)} style={{ cursor: "pointer", color: yearParam === y ? "#8a3ffc" : "#cccccc", fontSize: "13px", padding: "2px 4px" }} onMouseEnter={(e) => e.currentTarget.style.color = "#8a3ffc"} onMouseLeave={(e) => e.currentTarget.style.color = yearParam === y ? "#8a3ffc" : "#cccccc"}>Năm {y}</span>
                  ))}
                </div>
              )}
            </div>

            <span onClick={() => router.push("/?type=phim-chieu-rap")} style={{ cursor: "pointer", color: typeParam === "phim-chieu-rap" ? "#8a3ffc" : "#b3b3b3" }}>Phim Chiếu Rạp</span>
            <span onClick={() => router.push("/?type=thuyet-minh")} style={{ cursor: "pointer", color: typeParam === "thuyet-minh" ? "#8a3ffc" : "#b3b3b3" }}>Phim Thuyết Minh</span>
          </nav>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <input 
            type="text" 
            placeholder="Tìm phim + ấn Enter..." 
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={handleSearch}
            style={{ backgroundColor: "#141414", border: "1px solid #251e36", color: "#ffffff", padding: "8px 18px", borderRadius: "20px", fontSize: "12px", width: "220px", outline: "none" }}
          />
          <span style={{ color: "#ffffff", fontSize: "13px", cursor: "pointer", fontWeight: "500" }}>👤 Đăng nhập</span>
        </div>
      </header>

      {/* CONTAINER CHÍNH */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "75px 20px 25px 20px" }}>
        
        {/* SLIDER ĐỀ CỬ */}
        {isHome && featuredMovies.length > 0 && (
          <section style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "15px", color: "#ffffff", textTransform: "uppercase", borderLeft: "3px solid #8a3ffc", paddingLeft: "10px", marginBottom: "15px", fontWeight: "700", letterSpacing: "0.5px" }}>
              Meephim Đề Cử Chọn Lọc
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "12px" }}>
              {featuredMovies.slice(0, 8).map((movie) => (
                <div key={movie._id} onClick={() => router.push(`/movie/${movie.slug}`)} style={{ cursor: "pointer" }}>
                  <div style={{ position: "relative", width: "100%", height: "185px", borderRadius: "5px", overflow: "hidden", backgroundColor: "#111111" }}>
                    <img src={getCleanImageUrl(movie.poster_url || movie.thumb_url)} alt={movie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    <span style={{ position: "absolute", bottom: "6px", left: "6px", backgroundColor: "rgba(0,0,0,0.85)", color: "#00f5d4", fontSize: "9px", padding: "2px 5px", borderRadius: "3px", fontWeight: "600" }}>{movie.episode_current || "Bản Đẹp"}</span>
                  </div>
                  <h3 style={{ fontSize: "12px", margin: "6px 0 2px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#ffffff", fontWeight: "600" }}>{movie.name}</h3>
                </div>
              ))}
            </div>
          </section>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: "30px" }}>
          
          <main>
            {isHome ? (
              <div>
                <div style={{ marginBottom: "15px" }}>
                  <h2 style={{ fontSize: "16px", color: "#8a3ffc", textTransform: "uppercase", fontWeight: "700", margin: "0 0 18px 0" }}>
                    Phim Mới Cập Nhật
                  </h2>
                </div>
                {renderMovieChunk(moviesUpdated, 0, false)}

                <div style={{ marginTop: "40px", marginBottom: "15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1a1a1a", paddingBottom: "8px", marginBottom: "18px" }}>
                    <h2 style={{ fontSize: "16px", color: "#ffffff", textTransform: "uppercase", fontWeight: "700", margin: 0 }}>
                      Phim Chiếu Rạp Mới
                    </h2>
                    <span onClick={() => router.push("/?type=phim-chieu-rap")} style={{ color: "#8a3ffc", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>Xem tất cả ›</span>
                  </div>
                </div>
                {renderMovieChunk(moviesCinema, 0, false)}
                {renderMovieChunk(moviesCinema, 5, true)}

                <div style={{ marginTop: "40px", marginBottom: "15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1a1a1a", paddingBottom: "8px", marginBottom: "18px" }}>
                    <h2 style={{ fontSize: "16px", color: "#ffffff", textTransform: "uppercase", fontWeight: "700", margin: 0 }}>
                      Phim Bộ Mới
                    </h2>
                    <span onClick={() => router.push("/?type=phim-bo")} style={{ color: "#8a3ffc", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>Xem tất cả ›</span>
                  </div>
                </div>
                {renderMovieChunk(moviesSeries, 0, false)}
                {renderMovieChunk(moviesSeries, 5, true)}
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #222", paddingBottom: "12px", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "16px", color: "#8a3ffc", textTransform: "uppercase", margin: 0, fontWeight: "700" }}>{titlePage}</h2>
                  <span onClick={handleGoHome} style={{ color: "#8a3ffc", fontSize: "12px", cursor: "pointer", fontWeight: "700" }}>← Quay lại trang chủ</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" }}>
                  {searchMovies.length > 0 ? (
                    searchMovies.map((movie) => (
                      <div key={movie._id} onClick={() => router.push(`/movie/${movie.slug}`)} style={{ cursor: "pointer", marginBottom: "15px" }}>
                        <div style={{ position: "relative", width: "100%", height: "240px", borderRadius: "6px", overflow: "hidden", backgroundColor: "#111", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
                          <img src={getCleanImageUrl(movie.poster_url || movie.thumb_url)} alt={movie.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                          <span style={{ position: "absolute", top: "8px", left: "8px", backgroundColor: "#00f5d4", color: "#000000", fontSize: "8px", fontWeight: "700", padding: "2px 4px", borderRadius: "2px" }}>HD</span>
                        </div>
                        <h3 style={{ fontSize: "12px", fontWeight: "600", margin: "8px 0 2px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#ffffff" }}>{movie.name}</h3>
                        <p style={{ fontSize: "12px", color: "#aaaaaa", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{movie.origin_name}</p>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#999999", gridColumn: "span 4", textAlign: "center", padding: "40px 0", fontSize: "14px" }}>Không tìm thấy phim phù hợp theo bộ lọc này từ API.</div>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* SIDEBAR BÊN PHẢI */}
          <aside>
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
        <div style={{ maxWidth: "1240px", margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "60px", padding: "0 20px" }}>
          <div>
            <div onClick={handleGoHome} style={{ cursor: "pointer", display: "flex", alignItems: "center", marginBottom: "15px" }}>
              <img 
                src="/logo.png" 
                alt="Meephim Logo" 
                style={{ height: "52.5px", width: "auto", objectFit: "contain" }} 
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  if(e.currentTarget.nextSibling) {
                    (e.currentTarget.nextSibling as HTMLElement).style.display = "block";
                  }
                }}
              />
              <div style={{ display: "none", fontSize: "30px", fontWeight: "700", color: "#ffffff", letterSpacing: "-0.5px" }}>
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
      </footer>

    </div>
  );
}

// Bọc Component trong Suspense để tránh lỗi của Next.js khi dùng useSearchParams ở Client Component
export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ color: "#8a3ffc", backgroundColor: "#060606", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>Đang tải nội dung...</div>}>
      <HomePageContent />
    </Suspense>
  );
}