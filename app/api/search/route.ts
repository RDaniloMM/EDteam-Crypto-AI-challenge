import { searchCrypto } from "@/app/lib/coingecko";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ coins: [] });
  }

  try {
    const coins = await searchCrypto(query);

    // Limitar a 10 resultados y ordenar por market_cap_rank
    const sortedCoins = coins
      .sort(
        (a, b) =>
          (a.market_cap_rank || Infinity) - (b.market_cap_rank || Infinity),
      )
      .slice(0, 10);

    return NextResponse.json({ coins: sortedCoins });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { coins: [], error: "Error en la búsqueda" },
      { status: 500 },
    );
  }
}
