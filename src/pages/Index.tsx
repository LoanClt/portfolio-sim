import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Info, ExternalLink, AlertCircle, X, Share2 } from 'lucide-react';
import PortfolioManager from '@/components/PortfolioManager';
import PortfolioResults from '@/components/PortfolioResults';
import { DebugPanel } from '@/components/DebugPanel';
import { AuthModal } from '@/components/AuthModal';
import { UserProfileButton } from '@/components/UserProfileButton';
import { ShareSimulationDialog } from '@/components/ShareSimulationDialog';
import { SharedSimulationsDialog } from '@/components/SharedSimulationsDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { runPortfolioSimulation } from '@/utils/portfolioSimulation';
import { getSharedSimulationFromUrl, isValidSharedSimulation } from '@/utils/shareSimulation';
import { useNotifications } from '@/components/NotificationSystem';
import type { PortfolioInvestment, PortfolioSimulationParams, CustomParameterSet } from '@/types/portfolio';
import type { SharedSimulation } from '@/services/sharedSimulationService';

const Index = () => {
  // Auth state
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const { unreadCount, refreshUnreadCount } = useUnreadCount();

  // Portfolio data hook
  const { 
    investments: portfolioInvestments, 
    customParameterSets, 
    importInvestments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    savePortfolioToCloud,
    loadPortfolioFromCloud,
    getSavedPortfolios,
    deletePortfolioFromCloud,
    refreshData
  } = usePortfolioData();

  // Shared simulation state
  const [sharedSimulationLoaded, setSharedSimulationLoaded] = useState(false);
  const [sharedSimulationInfo, setSharedSimulationInfo] = useState<string | null>(null);
  const [showSharedNotice, setShowSharedNotice] = useState(false);
  
  // Share simulation dialog state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSharedSimulationsDialog, setShowSharedSimulationsDialog] = useState(false);

  // Portfolio mode state
  const [portfolioParams, setPortfolioParams] = useState<PortfolioSimulationParams>({
    numSimulations: 100,
    setupFees: 2,
    managementFees: 2,
    managementFeeYears: 10,
    followOnStrategy: {
      enableEarlyFollowOns: false,
      earlyFollowOnRate: 20, // 20% of successful companies get follow-on (more conservative)
      earlyFollowOnMultiple: 1.0, // 1x of original check size
      enableRecycling: false, // Disabled as requested
      recyclingRate: 0, // Set to 0 since disabled
      reserveRatio: 30 // 30% of fund reserved for follow-ons (more conservative)
    }
  });
  const [portfolioResults, setPortfolioResults] = useState<any>(null);
  const [isRunningPortfolioSim, setIsRunningPortfolioSim] = useState(false);

  // Load shared simulation on component mount
  useEffect(() => {
    const loadSharedSimulation = async () => {
      const sharedData = getSharedSimulationFromUrl();
      if (sharedData && isValidSharedSimulation(sharedData)) {
        try {
          // Load the shared simulation data
          await importInvestments(sharedData.investments);
          setPortfolioParams(sharedData.params);
          
          if (sharedData.results) {
            setPortfolioResults(sharedData.results);
          }
          
          // Create summary info for display  
          const companies = sharedData.investments.length
          const totalInvestment = sharedData.investments.reduce((sum, inv) => sum + inv.checkSize, 0)
          const summary = `${companies} companies, $${totalInvestment.toFixed(1)}MM total`
          
          setSharedSimulationInfo(`Loaded shared simulation: ${summary}`);
          setSharedSimulationLoaded(true);
          setShowSharedNotice(true);
          
          // Clean the URL without refreshing the page
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('Error loading shared simulation:', error);
        }
      }
    };

    loadSharedSimulation();
  }, [importInvestments]);



  const runPortfolioSim = async () => {
    if (portfolioInvestments.length === 0) return;
    
    setIsRunningPortfolioSim(true);
    try {
      const results = runPortfolioSimulation(portfolioInvestments, portfolioParams);
      setPortfolioResults(results);
    } finally {
      setIsRunningPortfolioSim(false);
    }
  };

  const handleLoadSharedSimulation = async (simulation: SharedSimulation) => {
    try {
      // Load the simulation data using the hook's import function
      await importInvestments(simulation.portfolioData)
      
      setPortfolioParams(simulation.simulationParams)
      
      // Create summary info for display
      const companies = simulation.portfolioData.length
      const totalInvestment = simulation.portfolioData.reduce((sum, inv) => sum + inv.checkSize, 0)
      const summary = `${companies} companies, $${totalInvestment.toFixed(1)}MM total`
      
      setSharedSimulationInfo(`Loaded simulation from ${simulation.senderName}: ${summary}`)
      setSharedSimulationLoaded(true)
      setShowSharedNotice(true)
      
      // Refresh unread count
      refreshUnreadCount()
      
      showSuccess('Simulation Loaded', 'Successfully loaded shared simulation')
    } catch (error) {
      console.error('Error loading shared simulation:', error)
      showError('Load Failed', 'Failed to load simulation')
    }
  }

  // Portfolio simulation results
  // const portfolioResults = useMemo(() => {
  //   if (portfolioInvestments.length === 0) return null;
  //   return runPortfolioSimulation(portfolioInvestments, portfolioParams);
  // }, [portfolioInvestments, portfolioParams]);

  const totalInvestments = portfolioInvestments.reduce((sum, inv) => sum + inv.checkSize, 0);
  const totalFees = portfolioParams.setupFees + (portfolioParams.managementFees * portfolioParams.managementFeeYears);
  const followOnReserve = totalInvestments * (portfolioParams.followOnStrategy.reserveRatio / 100);
  const totalFundSize = totalInvestments + totalFees + followOnReserve;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <img src="/SRV.png" alt="SRV logo" className="w-20 h-20 object-contain" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">VC Portfolio Simulator</h1>
                <p className="text-slate-600 mt-1">
                  Model venture capital fund performance with Monte Carlo simulation
                </p>
                <p className="text-xs text-slate-500 mt-1 italic">Solution proposed by Silicon Roundabout Ventures</p>
              </div>
            </div>
            
            {/* Authentication Section */}
            <div className="flex items-center gap-3">
              {loading ? (
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : user ? (
                <UserProfileButton />
              ) : (
                <Button 
                  onClick={() => setShowAuthModal(true)}
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                >
                  Sign In / Sign Up
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Shared Simulation Notice */}
        {showSharedNotice && sharedSimulationInfo && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-blue-900">Shared Simulation Loaded</h3>
                    <p className="text-sm text-blue-800 mt-1">{sharedSimulationInfo}</p>
                    <p className="text-xs text-blue-700 mt-2">
                      You can now view and modify this simulation.
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSharedNotice(false)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="portfolio">Your Portfolio</TabsTrigger>
          </TabsList>

          {/* Portfolio Mode */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Portfolio Management */}
              <div className="lg:col-span-2">
                <PortfolioManager
                  portfolioData={portfolioInvestments}
                  simulationParams={portfolioParams}
                  customSets={customParameterSets}
                  addInvestment={addInvestment}
                  updateInvestment={updateInvestment}
                  deleteInvestment={deleteInvestment}
                  savePortfolioToCloud={savePortfolioToCloud}
                  loadPortfolioFromCloud={loadPortfolioFromCloud}
                  getSavedPortfolios={getSavedPortfolios}
                  deletePortfolioFromCloud={deletePortfolioFromCloud}
                  refreshData={refreshData}
                  onShareClick={() => setShowShareDialog(true)}
                  onViewSharedClick={() => setShowSharedSimulationsDialog(true)}
                  unreadCount={unreadCount}
                  onImportInvestments={importInvestments}
                />
              </div>

              {/* Portfolio Simulation Parameters */}
              <div className="space-y-4">
                {/* Debug Panel */}
                <DebugPanel />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Simulation Parameters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Fee Notice */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Note about fees</p>
                        <p className="text-blue-700">Setup and Management fees are for fund size calculation only - they don't affect simulation outcomes.</p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="numSims">Number of Simulations</Label>
                      <Input
                        id="numSims"
                        type="number"
                        min="1"
                        max="100000"
                        step="1"
                        value={portfolioParams.numSimulations}
                        onChange={(e) => setPortfolioParams({
                          ...portfolioParams,
                          numSimulations: parseInt(e.target.value) || 100
                        })}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label htmlFor="setupFees">Setup Fees ($MM)</Label>
                      <Input
                        id="setupFees"
                        type="number"
                        min="0"
                        step="0.1"
                        value={portfolioParams.setupFees}
                        onChange={(e) => setPortfolioParams({
                          ...portfolioParams,
                          setupFees: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="managementFees">Management Fees (% annually)</Label>
                      <Input
                        id="managementFees"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={portfolioParams.managementFees}
                        onChange={(e) => setPortfolioParams({
                          ...portfolioParams,
                          managementFees: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="managementFeeYears">Management Fee Years</Label>
                      <Input
                        id="managementFeeYears"
                        type="number"
                        min="1"
                        max="20"
                        step="1"
                        value={portfolioParams.managementFeeYears}
                        onChange={(e) => setPortfolioParams({
                          ...portfolioParams,
                          managementFeeYears: parseInt(e.target.value) || 10
                        })}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Follow-on Strategy</h4>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="enableEarlyFollowOns"
                          checked={portfolioParams.followOnStrategy.enableEarlyFollowOns}
                          onCheckedChange={(checked) => setPortfolioParams({
                            ...portfolioParams,
                            followOnStrategy: {
                              ...portfolioParams.followOnStrategy,
                              enableEarlyFollowOns: !!checked
                            }
                          })}
                        />
                        <Label htmlFor="enableEarlyFollowOns" className="text-sm">
                          Enable Early Follow-ons
                        </Label>
                      </div>

                      {portfolioParams.followOnStrategy.enableEarlyFollowOns && (
                        <div className="ml-6 space-y-3">
                          <div>
                            <Label htmlFor="followOnRate" className="text-xs">Follow-on Rate (%)</Label>
                            <Input
                              id="followOnRate"
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={portfolioParams.followOnStrategy.earlyFollowOnRate}
                              onChange={(e) => setPortfolioParams({
                                ...portfolioParams,
                                followOnStrategy: {
                                  ...portfolioParams.followOnStrategy,
                                  earlyFollowOnRate: parseInt(e.target.value) || 0
                                }
                              })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="followOnMultiple" className="text-xs">Follow-on Multiple (x)</Label>
                            <Input
                              id="followOnMultiple"
                              type="number"
                              min="0"
                              step="0.1"
                              value={portfolioParams.followOnStrategy.earlyFollowOnMultiple}
                              onChange={(e) => setPortfolioParams({
                                ...portfolioParams,
                                followOnStrategy: {
                                  ...portfolioParams.followOnStrategy,
                                  earlyFollowOnMultiple: parseFloat(e.target.value) || 0
                                }
                              })}
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="reserveRatio" className="text-xs">Reserve Ratio (%)</Label>
                        <Input
                          id="reserveRatio"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={portfolioParams.followOnStrategy.reserveRatio}
                          onChange={(e) => setPortfolioParams({
                            ...portfolioParams,
                            followOnStrategy: {
                              ...portfolioParams.followOnStrategy,
                              reserveRatio: parseInt(e.target.value) || 0
                            }
                          })}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="text-sm text-slate-600">
                        <div>Investments: ${totalInvestments.toFixed(1)}MM</div>
                        <div>Setup Fees: ${portfolioParams.setupFees.toFixed(1)}MM</div>
                        <div>Management Fees: ${totalFees.toFixed(1)}MM</div>
                        {portfolioParams.followOnStrategy.enableEarlyFollowOns && (
                          <div>Follow-on Reserve: ${followOnReserve.toFixed(1)}MM</div>
                        )}
                        <div className="font-semibold">Total Fund: ${totalFundSize.toFixed(1)}MM</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button 
                        onClick={runPortfolioSim}
                        disabled={portfolioInvestments.length === 0 || isRunningPortfolioSim}
                        className="w-full"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isRunningPortfolioSim ? 'Running...' : 'Run Portfolio Simulation'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Portfolio Results */}
            {portfolioResults && (
              <div className="mt-8">
                <PortfolioResults 
                  results={portfolioResults} 
                  investments={portfolioInvestments}
                  params={portfolioParams}
                />
              </div>
            )}

            {portfolioInvestments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-600 mb-4">
                  Add investments to your portfolio to see simulation results
                </p>
              </div>
            )}
          </TabsContent>


        </Tabs>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      
      {/* Share Simulation Dialog */}
      <ShareSimulationDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        portfolioData={portfolioInvestments}
        simulationParams={portfolioParams}
        customSets={customParameterSets}
      />
      
      {/* Shared Simulations Dialog */}
      <SharedSimulationsDialog
        open={showSharedSimulationsDialog}
        onOpenChange={setShowSharedSimulationsDialog}
        onLoadSharedSimulation={handleLoadSharedSimulation}
      />
    </div>
  );
};

export default Index;
