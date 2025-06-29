// Market Data Service - Real-time data collection for portfolio calibration
// This demonstrates various approaches to collecting actual market data

export interface MarketData {
  timestamp: Date;
  sp500Index: number;
  sp500Change: number;
  vixLevel: number;
  tenYearYield: number;
  fedFundsRate: number;
  sentiment: 'bullish' | 'neutral' | 'bearish';
  sectorsData: SectorData[];
}

export interface SectorData {
  sector: string;
  performance: number; // % change
  volatility: number;
  volume: number;
}

export interface VCMarketData {
  averageValuation: number;
  dealCount: number;
  averageRound: number;
  exitMultiples: {
    median: number;
    mean: number;
  };
}

class MarketDataService {
  private cache: Map<string, any> = new Map();
  private lastUpdate: Date = new Date(0);
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Method 1: Free APIs (Limited but functional)
  async getBasicMarketData(): Promise<Partial<MarketData>> {
    try {
      // Alpha Vantage (free tier: 5 calls/min, 500 calls/day)
      const alphavantageKey = process.env.REACT_APP_ALPHAVANTAGE_KEY;
      
      if (!alphavantageKey) {
        console.warn('No Alpha Vantage API key found. Using mock data.');
        return this.getMockMarketData();
      }

      // Fetch S&P 500 data
      const sp500Response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${alphavantageKey}`
      );
      const sp500Data = await sp500Response.json();

      // Fetch VIX data  
      const vixResponse = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=VIX&apikey=${alphavantageKey}`
      );
      const vixData = await vixResponse.json();

      return {
        timestamp: new Date(),
        sp500Index: parseFloat(sp500Data['Global Quote']?.['05. price'] || '4500'),
        sp500Change: parseFloat(sp500Data['Global Quote']?.['09. change'] || '0'),
        vixLevel: parseFloat(vixData['Global Quote']?.['05. price'] || '18'),
        sentiment: this.calculateSentiment(sp500Data, vixData)
      };

    } catch (error) {
      console.error('Error fetching market data:', error);
      return this.getMockMarketData();
    }
  }

  // Method 2: Yahoo Finance (Unofficial but popular)
  async getYahooFinanceData(): Promise<Partial<MarketData>> {
    try {
      // Note: This uses unofficial Yahoo Finance endpoints
      // For production, consider using yfinance Python library via API
      
      const symbols = ['SPY', 'VIX', '^TNX']; // S&P 500, VIX, 10-Year Treasury
      const promises = symbols.map(symbol => 
        fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`)
          .then(res => res.json())
      );

      const results = await Promise.all(promises);
      
      const spyData = results[0]?.chart?.result?.[0];
      const vixData = results[1]?.chart?.result?.[0];
      const treasuryData = results[2]?.chart?.result?.[0];

      return {
        timestamp: new Date(),
        sp500Index: spyData?.meta?.regularMarketPrice || 4500,
        vixLevel: vixData?.meta?.regularMarketPrice || 18,
        tenYearYield: treasuryData?.meta?.regularMarketPrice || 4.5,
        sentiment: this.calculateSentimentFromNumbers(
          spyData?.meta?.regularMarketPrice,
          vixData?.meta?.regularMarketPrice
        )
      };

    } catch (error) {
      console.error('Error fetching Yahoo Finance data:', error);
      return this.getMockMarketData();
    }
  }

  // Method 3: Federal Reserve Economic Data (FRED) - Free and reliable
  async getFedData(): Promise<Partial<MarketData>> {
    try {
      const fredKey = process.env.REACT_APP_FRED_API_KEY;
      
      if (!fredKey) {
        return { fedFundsRate: 5.25 }; // Mock current rate
      }

      // Get Federal Funds Rate
      const fedResponse = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${fredKey}&file_type=json&limit=1&sort_order=desc`
      );
      const fedData = await fedResponse.json();

      return {
        fedFundsRate: parseFloat(fedData.observations?.[0]?.value || '5.25')
      };

    } catch (error) {
      console.error('Error fetching FRED data:', error);
      return { fedFundsRate: 5.25 };
    }
  }

  // Method 4: News/Sentiment Analysis (Mock implementation)
  async getMarketSentiment(): Promise<'bullish' | 'neutral' | 'bearish'> {
    try {
      // This would integrate with news APIs like NewsAPI, Twitter API, etc.
      // For now, we'll use a simple heuristic based on market data
      
      const marketData = await this.getBasicMarketData();
      return this.calculateSentiment(marketData);
      
    } catch (error) {
      return 'neutral';
    }
  }

  // Method 5: Crypto/Alternative markets (for modern VC calibration)
  async getCryptoData(): Promise<any> {
    try {
      // CoinGecko is free and doesn't require API key for basic usage
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'
      );
      const data = await response.json();

      return {
        bitcoin: {
          price: data.bitcoin?.usd,
          change24h: data.bitcoin?.usd_24h_change
        },
        ethereum: {
          price: data.ethereum?.usd,
          change24h: data.ethereum?.usd_24h_change
        }
      };

    } catch (error) {
      console.error('Error fetching crypto data:', error);
      return null;
    }
  }

  // Combined method that fetches all available data
  async getRealTimeMarketData(): Promise<MarketData> {
    // Check cache first
    const cacheKey = 'market_data';
    const now = new Date();
    
    if (this.cache.has(cacheKey) && 
        now.getTime() - this.lastUpdate.getTime() < this.CACHE_DURATION) {
      return this.cache.get(cacheKey);
    }

    try {
      // Fetch data from multiple sources in parallel
      const [basicData, yahooData, fedData, cryptoData] = await Promise.all([
        this.getBasicMarketData(),
        this.getYahooFinanceData(),
        this.getFedData(),
        this.getCryptoData()
      ]);

      // Combine all data sources
      const combinedData: MarketData = {
        timestamp: now,
        sp500Index: yahooData.sp500Index || basicData.sp500Index || 4500,
        sp500Change: basicData.sp500Change || 0,
        vixLevel: yahooData.vixLevel || basicData.vixLevel || 18,
        tenYearYield: yahooData.tenYearYield || 4.5,
        fedFundsRate: fedData.fedFundsRate || 5.25,
        sentiment: basicData.sentiment || 'neutral',
        sectorsData: await this.getSectorData()
      };

      // Cache the result
      this.cache.set(cacheKey, combinedData);
      this.lastUpdate = now;

      return combinedData;

    } catch (error) {
      console.error('Error fetching comprehensive market data:', error);
      return this.getMockMarketData();
    }
  }

  // Get sector-specific data
  private async getSectorData(): Promise<SectorData[]> {
    // This would fetch sector ETF data (XLK, XLF, XLV, etc.)
    // For now, return mock data
    return [
      { sector: 'Technology', performance: 1.2, volatility: 22.5, volume: 1000000 },
      { sector: 'Healthcare', performance: 0.8, volatility: 18.3, volume: 800000 },
      { sector: 'Finance', performance: -0.5, volatility: 25.1, volume: 1200000 },
      { sector: 'Energy', performance: 2.1, volatility: 35.2, volume: 600000 }
    ];
  }

  // Sentiment calculation based on market indicators
  private calculateSentiment(sp500Data?: any, vixData?: any): 'bullish' | 'neutral' | 'bearish' {
    const sp500Change = sp500Data?.sp500Change || 0;
    const vixLevel = vixData?.vixLevel || 20;

    if (sp500Change > 1 && vixLevel < 16) return 'bullish';
    if (sp500Change < -1 || vixLevel > 25) return 'bearish';
    return 'neutral';
  }

  private calculateSentimentFromNumbers(sp500Price?: number, vixLevel?: number): 'bullish' | 'neutral' | 'bearish' {
    if (!sp500Price || !vixLevel) return 'neutral';
    
    if (vixLevel < 16) return 'bullish';
    if (vixLevel > 25) return 'bearish';
    return 'neutral';
  }

  // Fallback mock data when APIs are unavailable
  private getMockMarketData(): MarketData {
    const now = new Date();
    const hourOfDay = now.getHours();
    
    // Simulate realistic market movements based on time of day
    const basePrice = 4500;
    const dailyVariation = Math.sin(hourOfDay / 24 * Math.PI * 2) * 50;
    const randomNoise = (Math.random() - 0.5) * 20;
    
    return {
      timestamp: now,
      sp500Index: basePrice + dailyVariation + randomNoise,
      sp500Change: dailyVariation + randomNoise * 0.1,
      vixLevel: 18 + Math.random() * 10,
      tenYearYield: 4.5 + (Math.random() - 0.5),
      fedFundsRate: 5.25,
      sentiment: Math.random() > 0.6 ? 'bullish' : Math.random() < 0.3 ? 'bearish' : 'neutral',
      sectorsData: [
        { sector: 'Technology', performance: (Math.random() - 0.5) * 4, volatility: 20 + Math.random() * 10, volume: 1000000 },
        { sector: 'Healthcare', performance: (Math.random() - 0.5) * 3, volatility: 15 + Math.random() * 8, volume: 800000 },
        { sector: 'Finance', performance: (Math.random() - 0.5) * 5, volatility: 25 + Math.random() * 15, volume: 1200000 },
        { sector: 'Energy', performance: (Math.random() - 0.5) * 6, volatility: 30 + Math.random() * 20, volume: 600000 }
      ]
    };
  }

  // VC-specific data (would integrate with PitchBook, CB Insights APIs)
  async getVCMarketData(): Promise<VCMarketData> {
    // This would require expensive data subscriptions
    // Mock implementation showing what real data would look like
    return {
      averageValuation: 50.2, // $50.2M average Series A
      dealCount: 1250, // Deals this quarter
      averageRound: 15.8, // $15.8M average round size
      exitMultiples: {
        median: 3.2,
        mean: 4.7
      }
    };
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();

// Usage example:
/*
// In your component:
const [marketData, setMarketData] = useState<MarketData | null>(null);

useEffect(() => {
  if (realTimeCalibration) {
    const fetchData = async () => {
      const data = await marketDataService.getRealTimeMarketData();
      setMarketData(data);
    };
    
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Update every 5 minutes
    
    return () => clearInterval(interval);
  }
}, [realTimeCalibration]);
*/ 