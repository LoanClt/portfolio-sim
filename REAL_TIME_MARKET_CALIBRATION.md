# Real-Time Market Calibration

## Overview

The Real-Time Market Calibration feature in the VC Portfolio Simulator automatically adjusts forecast models based on current market conditions. When enabled, the system fetches live market data and dynamically calibrates portfolio projections to reflect real-world economic conditions.

## How It Works

### 1. Data Collection Sources

The system attempts to gather data from multiple sources in order of preference:

#### **Free APIs (Currently Implemented)**
- **Alpha Vantage** - Stock market data (requires API key)
- **Yahoo Finance** - Unofficial endpoints for market indices
- **Federal Reserve Economic Data (FRED)** - Economic indicators
- **CoinGecko** - Cryptocurrency market data (no key required)

#### **Mock Data Fallback**
If APIs are unavailable or rate-limited, the system generates realistic mock data based on:
- Time of day patterns
- Random market movements
- Historical volatility ranges

### 2. Market Indicators Tracked

| Indicator | Source | Impact on Forecast |
|-----------|--------|-------------------|
| **S&P 500 Index** | Yahoo Finance/Alpha Vantage | Baseline market performance |
| **S&P 500 Daily Change** | Yahoo Finance/Alpha Vantage | Short-term market sentiment |
| **VIX (Volatility Index)** | Yahoo Finance/Alpha Vantage | Risk assessment and confidence levels |
| **10-Year Treasury Yield** | Yahoo Finance | Interest rate environment |
| **Federal Funds Rate** | Federal Reserve FRED API | Monetary policy impact |
| **Market Sentiment** | Calculated from indicators | Overall forecast adjustment |

### 3. Calibration Algorithm

The system adjusts forecasts using the following logic:

#### **Market Sentiment Adjustment**
```
Bullish (S&P up >1%, VIX <16):
- MOIC multiplier: +15%
- IRR adjustment: +3.2%

Bearish (S&P down >1% OR VIX >25):
- MOIC multiplier: -15%
- IRR adjustment: -2.8%

Neutral: No adjustment
```

#### **Volatility Impact (VIX-based)**
```
High Volatility (VIX >25):
- MOIC multiplier: -10%
- IRR adjustment: -1.5%
- Risk level: Increased

Low Volatility (VIX <15):
- MOIC multiplier: +10%
- IRR adjustment: +1.2%
- Risk level: Decreased
```

#### **Interest Rate Impact**
```
High Rates (Fed Funds >5.5%):
- MOIC multiplier: -8%
- IRR adjustment: -1.8%
- Rationale: Higher discount rates reduce valuations
```

## Setup Instructions

### Option 1: Using Free APIs (Recommended)

1. **Get a free Alpha Vantage API key:**
   - Visit: https://www.alphavantage.co/support/#api-key
   - Sign up for free (500 requests/day limit)

2. **Add to environment variables:**
   ```bash
   REACT_APP_ALPHAVANTAGE_KEY=your_api_key_here
   ```

3. **Optional: Get a FRED API key:**
   - Visit: https://fred.stlouisfed.org/docs/api/api_key.html
   - Free and unlimited for non-commercial use
   ```bash
   REACT_APP_FRED_API_KEY=your_fred_key_here
   ```

### Option 2: Mock Data Only

The system works without any API keys by generating realistic mock data. This is perfect for:
- Development and testing
- Demonstrations
- Users who don't want to manage API keys

## Usage

1. **Enable Real-Time Calibration:**
   - Open the Portfolio Forecast dashboard
   - Expand "Advanced Options"
   - Check "Real-time market calibration"

2. **Monitor Data Status:**
   - Green "Live data connected" = Successfully fetching real data
   - Blue "Fetching market data..." = Loading
   - Red "Failed to fetch market data" = Using mock data

3. **View Market Data:**
   - When enabled, a "Live Market Data" card appears
   - Shows current S&P 500, VIX, Treasury yield, Fed rate
   - Displays market sentiment (bullish/neutral/bearish)

4. **Understand Adjustments:**
   - Forecast metrics will show "Market-adjusted" instead of standard
   - A calibration notice explains current market impact
   - Risk assessments adapt to current volatility levels

## Data Sources & Costs

| Source | Cost | Rate Limits | Reliability |
|--------|------|-------------|-------------|
| **Alpha Vantage** | Free tier available | 5 calls/min, 500/day | High |
| **Yahoo Finance** | Free (unofficial) | No official limits | Medium |
| **FRED** | Free | No limits | Very High |
| **CoinGecko** | Free | 50 calls/min | High |
| **Mock Data** | Free | No limits | N/A |

## Professional Data Sources

For institutional use, consider integrating:

| Provider | Cost | Features |
|----------|------|----------|
| **Bloomberg API** | $24,000+/year | Real-time everything |
| **Refinitiv Eikon** | $22,000+/year | Comprehensive financial data |
| **IEX Cloud** | $9-$500/month | Reliable stock market data |
| **Quandl** | $50-$500/month | Economic and financial data |
| **PitchBook API** | Enterprise pricing | VC-specific data |

## Technical Implementation

### Code Structure
```
src/services/marketDataService.ts  # Data collection service
src/components/ForecastDashboard.tsx  # UI integration
```

### Key Functions
- `getRealTimeMarketData()` - Main data fetching function
- `getAdjustedMetrics()` - Applies market adjustments to forecasts
- `calculateSentiment()` - Determines market sentiment from indicators

### Error Handling
- Automatic fallback to mock data on API failures
- Rate limiting awareness
- Network error resilience
- Cache implementation (5-minute duration)

## Benefits

1. **Dynamic Accuracy:** Forecasts reflect current market conditions
2. **Risk Awareness:** Real-time volatility impacts risk assessments
3. **Transparency:** Users see exactly what market data is being used
4. **Flexibility:** Can be enabled/disabled per forecast
5. **Cost-Effective:** Works with free APIs or mock data

## Limitations

1. **API Dependencies:** Real-time features require internet connectivity
2. **Rate Limits:** Free APIs have usage restrictions
3. **Data Lag:** Some sources have 15-20 minute delays
4. **Simplified Model:** Current implementation uses basic adjustment factors
5. **Market Hours:** Some data sources only update during trading hours

## Future Enhancements

- **Machine Learning:** Train models on historical correlations
- **Sector-Specific:** Different adjustments per startup sector
- **News Integration:** Sentiment analysis from financial news
- **International Markets:** Global market indicators
- **Custom Indicators:** User-defined market metrics

## Example API Request

```javascript
// Alpha Vantage S&P 500 data
const response = await fetch(
  `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${key}`
);

// FRED Federal Funds Rate
const fedResponse = await fetch(
  `https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${fredKey}&file_type=json&limit=1&sort_order=desc`
);
```

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify API keys are correctly set
3. Test with real-time calibration disabled (uses mock data)
4. Review network connectivity for API access

The feature is designed to gracefully degrade - if real-time data isn't available, the system continues working with mock data, ensuring forecasts are always available. 