import type { PortfolioInvestment, PortfolioSimulationParams, PortfolioResults } from '@/types/portfolio';

export interface SharedSimulation {
  investments: PortfolioInvestment[];
  params: PortfolioSimulationParams;
  results?: PortfolioResults;
  timestamp: number;
}

// Compress and encode simulation data for URL sharing
export function encodeSimulationData(data: SharedSimulation): string {
  try {
    const jsonString = JSON.stringify(data);
    // Use base64 encoding for URL-safe sharing
    const encoded = btoa(jsonString);
    return encoded;
  } catch (error) {
    console.error('Error encoding simulation data:', error);
    throw new Error('Failed to encode simulation data');
  }
}

// Decode simulation data from URL
export function decodeSimulationData(encoded: string): SharedSimulation {
  try {
    const jsonString = atob(encoded);
    const data = JSON.parse(jsonString);
    
    // Validate the data structure
    if (!data.investments || !data.params || !data.timestamp) {
      throw new Error('Invalid simulation data structure');
    }
    
    return data as SharedSimulation;
  } catch (error) {
    console.error('Error decoding simulation data:', error);
    throw new Error('Failed to decode simulation data');
  }
}

// Create a shareable URL for the simulation
export function createShareableUrl(data: SharedSimulation): string {
  const encoded = encodeSimulationData(data);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?shared=${encoded}`;
}

// Generate a short description for the shared simulation
export function getSimulationSummary(data: SharedSimulation): string {
  const { investments, params, results } = data;
  const numCompanies = investments.length;
  const totalInvestment = investments.reduce((sum, inv) => sum + inv.checkSize, 0);
  const date = new Date(data.timestamp).toLocaleDateString();
  
  let summary = `VC Portfolio Simulation (${numCompanies} companies, $${totalInvestment.toFixed(1)}MM total)`;
  
  if (results) {
    summary += ` - Avg MOIC: ${results.avgMOIC.toFixed(2)}x, Success Rate: ${results.successRate.toFixed(1)}%`;
  }
  
  summary += ` - Shared on ${date}`;
  
  return summary;
}

// Copy share URL to clipboard
export async function copyShareUrl(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
  } catch (error) {
    // Fallback for browsers that don't support clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

// Extract shared simulation data from URL
export function getSharedSimulationFromUrl(): SharedSimulation | null {
  const urlParams = new URLSearchParams(window.location.search);
  const shared = urlParams.get('shared');
  
  if (!shared) {
    return null;
  }
  
  try {
    return decodeSimulationData(shared);
  } catch (error) {
    console.error('Error loading shared simulation:', error);
    return null;
  }
}

// Validate if a shared simulation is still valid (not too old, compatible format)
export function isValidSharedSimulation(data: SharedSimulation): boolean {
  // Check if the simulation is not older than 30 days
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  if (data.timestamp < thirtyDaysAgo) {
    return false;
  }
  
  // Check if required fields are present
  if (!data.investments || !Array.isArray(data.investments) || data.investments.length === 0) {
    return false;
  }
  
  if (!data.params || typeof data.params.numSimulations !== 'number') {
    return false;
  }
  
  // Validate investment structure
  const validInvestment = data.investments.every(inv => 
    inv.id && inv.companyName && inv.field && inv.region && 
    typeof inv.checkSize === 'number' && typeof inv.entryValuation === 'number'
  );
  
  return validInvestment;
} 