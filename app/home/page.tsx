import Navbar from "@/app/components/navbar";
import NewsCard from "@/app/components/newsCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F2F0EF] text-[#1c1b20]">
      <Navbar />
      <NewsCard /> 
      {/* just putting stuffs to link them and not to make this long :-) */}
    </div>
  );
}
