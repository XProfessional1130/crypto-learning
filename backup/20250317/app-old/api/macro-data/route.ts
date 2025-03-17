import { NextResponse } from 'next/server';
import { getMacroMarketData } from '@/lib/api/macro-market-data';

export async function GET() {
  try {
    const macroData = await getMacroMarketData();
    
    if (!macroData) {
      return NextResponse.json({
        success: false,
        error: 'No macro market data found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: macroData,
      lastUpdated: macroData.updated_at
    });
  } catch (error) {
    console.error('Error fetching macro market data:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error fetching macro market data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 