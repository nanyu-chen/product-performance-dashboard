'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts'
import {
  readExcelFile,
  transformToLongFormat,
  prepareChartData,
  getUniqueProducts,
  getUniqueDays,
  type RawProductData,
  type TransformedProductData,
  type ChartDataPoint
} from '@/lib/dataTransformation'

// Color palette for products (accessible and distinct)
const PRODUCT_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
  '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5'
]

interface VisibilityState {
  [key: string]: boolean
}

export default function ProductManagerDashboard() {
  const [rawData, setRawData] = useState<RawProductData[]>([])
  const [transformedData, setTransformedData] = useState<TransformedProductData[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [lineVisibility, setLineVisibility] = useState<VisibilityState>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Derived data
  const availableProducts = useMemo(() => getUniqueProducts(transformedData), [transformedData])
  
  const filteredProducts = useMemo(() => {
    return availableProducts.filter(product =>
      product.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [availableProducts, searchTerm])
  
  const chartData = useMemo(() => {
    if (selectedProducts.length === 0) return []
    return prepareChartData(transformedData, selectedProducts, [1, 2, 3])
  }, [transformedData, selectedProducts])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // File upload handler
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')

    try {
      console.log('Reading Excel file...')
      const rawDataFromFile = await readExcelFile(file)
      console.log('Raw data loaded:', rawDataFromFile.length, 'rows')
      console.log('Sample raw data:', JSON.stringify(rawDataFromFile[0], null, 2))
      
      console.log('Transforming to long format...')
      const transformed = transformToLongFormat(rawDataFromFile)
      console.log('Transformed data:', transformed.length, 'rows')
      console.log('Sample transformed data:', JSON.stringify(transformed.slice(0, 3), null, 2))
      
      setRawData(rawDataFromFile)
      setTransformedData(transformed)
      setUploadedFileName(file.name)
      
      // Reset selections
      setSelectedProducts([])
      setLineVisibility({})
      
    } catch (err) {
      console.error('Error processing file:', err)
      setError('Failed to process the Excel file. Please check the format and ensure it contains the required columns.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Product selection handlers
  const handleProductSelect = useCallback((productName: string) => {
    setSelectedProducts(prev => {
      const newSelection = prev.includes(productName)
        ? prev.filter(p => p !== productName)
        : [...prev, productName]
      
      // Initialize visibility for new products
      if (!prev.includes(productName)) {
        setLineVisibility(prevVis => ({
          ...prevVis,
          [`${productName}_inventory`]: true,
          [`${productName}_procurementAmount`]: true,
          [`${productName}_salesAmount`]: true
        }))
      }
      
      return newSelection
    })
  }, [])

  const handleRemoveProduct = useCallback((productName: string) => {
    setSelectedProducts(prev => prev.filter(p => p !== productName))
    setLineVisibility(prev => {
      const newVis = { ...prev }
      delete newVis[`${productName}_inventory`]
      delete newVis[`${productName}_procurementAmount`]
      delete newVis[`${productName}_salesAmount`]
      return newVis
    })
  }, [])

  // Legend click handler for line visibility
  const handleLegendClick = useCallback((dataKey: string) => {
    setLineVisibility(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }))
  }, [])

  // Chart line generation
  const renderLines = useMemo(() => {
    const lines: React.ReactElement[] = []
    let colorIndex = 0

    selectedProducts.forEach(product => {
      const baseColor = PRODUCT_COLORS[colorIndex % PRODUCT_COLORS.length]
      
      // Inventory line (solid, left Y-axis)
      const inventoryKey = `${product}_inventory`
      if (lineVisibility[inventoryKey] !== false) {
        lines.push(
          <Line
            key={inventoryKey}
            yAxisId="left"
            type="monotone"
            dataKey={inventoryKey}
            stroke={baseColor}
            strokeWidth={3}
            dot={{ r: 5, fill: baseColor }}
            name={`${product} - Inventory`}
            connectNulls={false}
          />
        )
      }

      // Procurement Amount line (dashed, right Y-axis)
      const procurementKey = `${product}_procurementAmount`
      if (lineVisibility[procurementKey] !== false) {
        lines.push(
          <Line
            key={procurementKey}
            yAxisId="right"
            type="monotone"
            dataKey={procurementKey}
            stroke={baseColor}
            strokeWidth={2}
            strokeDasharray="8 4"
            dot={{ r: 4, fill: baseColor }}
            name={`${product} - Procurement`}
            connectNulls={false}
          />
        )
      }

      // Sales Amount line (dotted, right Y-axis)
      const salesKey = `${product}_salesAmount`
      if (lineVisibility[salesKey] !== false) {
        lines.push(
          <Line
            key={salesKey}
            yAxisId="right"
            type="monotone"
            dataKey={salesKey}
            stroke={baseColor}
            strokeWidth={2}
            strokeDasharray="2 4"
            dot={{ r: 4, fill: baseColor }}
            name={`${product} - Sales`}
            connectNulls={false}
          />
        )
      }

      colorIndex++
    })

    return lines
  }, [selectedProducts, lineVisibility])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg border-gray-300">
          <p className="font-semibold text-gray-900 mb-2">{`${label}`}</p>
          {payload.map((entry: any, index: number) => {
            const isInventory = entry.dataKey.includes('_inventory')
            const value = typeof entry.value === 'number' 
              ? isInventory 
                ? `${entry.value.toLocaleString()} units`
                : `$${entry.value.toLocaleString()}`
              : entry.value
            
            return (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {`${entry.name}: ${value}`}
              </p>
            )
          })}
        </div>
      )
    }
    return null
  }

  // Custom legend with flexible layout for many items
  const CustomLegend = ({ payload }: any) => {
    if (!payload || payload.length === 0) return null
    
    // Determine layout based on number of items
    const shouldUseVerticalLayout = payload.length > 6
    
    return (
      <div className="bg-gray-50 rounded-lg border p-3">
        <div className="text-xs text-gray-600 mb-3 font-medium flex items-center justify-between">
          <span>Click any item to toggle visibility:</span>
          <span className="text-gray-500">
            {payload.filter((item: any) => lineVisibility[item.dataKey] !== false).length} of {payload.length} visible
          </span>
        </div>
        
        {shouldUseVerticalLayout ? (
          /* Vertical Layout for Many Items */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {payload.map((entry: any, index: number) => {
              const isVisible = lineVisibility[entry.dataKey] !== false
              const lineStyle = entry.dataKey.includes('_inventory') 
                ? 'solid' 
                : entry.dataKey.includes('_procurementAmount')
                ? 'dashed'
                : 'dotted'
              
              return (
                <div
                  key={index}
                  className={`flex items-center space-x-2 cursor-pointer px-2 py-1.5 rounded-md transition-all hover:shadow-sm text-sm ${
                    isVisible 
                      ? 'bg-white shadow-sm border border-gray-200' 
                      : 'bg-gray-200 opacity-60 hover:opacity-80'
                  }`}
                  onClick={() => handleLegendClick(entry.dataKey)}
                  title={`Click to ${isVisible ? 'hide' : 'show'} ${entry.value}`}
                >
                  <div className="flex items-center flex-shrink-0">
                    {lineStyle === 'solid' && (
                      <div
                        className="w-4 h-0.5 rounded"
                        style={{ backgroundColor: entry.color }}
                      />
                    )}
                    {lineStyle === 'dashed' && (
                      <div className="w-4 flex space-x-0.5">
                        {[...Array(2)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1.5 h-0.5 rounded"
                            style={{ backgroundColor: entry.color }}
                          />
                        ))}
                      </div>
                    )}
                    {lineStyle === 'dotted' && (
                      <div className="w-4 flex space-x-0.5">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="w-0.5 h-0.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium truncate ${isVisible ? 'text-gray-900' : 'text-gray-500'}`}>
                    {entry.value}
                  </span>
                  {!isVisible && (
                    <span className="text-xs text-gray-400 flex-shrink-0">(hidden)</span>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* Horizontal Layout for Few Items */
          <div className="flex flex-wrap gap-2 justify-center">
            {payload.map((entry: any, index: number) => {
              const isVisible = lineVisibility[entry.dataKey] !== false
              const lineStyle = entry.dataKey.includes('_inventory') 
                ? 'solid' 
                : entry.dataKey.includes('_procurementAmount')
                ? 'dashed'
                : 'dotted'
              
              return (
                <div
                  key={index}
                  className={`flex items-center space-x-2 cursor-pointer px-3 py-2 rounded-md transition-all hover:shadow-sm ${
                    isVisible 
                      ? 'bg-white shadow-sm border border-gray-200' 
                      : 'bg-gray-200 opacity-60 hover:opacity-80'
                  }`}
                  onClick={() => handleLegendClick(entry.dataKey)}
                  title={`Click to ${isVisible ? 'hide' : 'show'} ${entry.value}`}
                >
                  <div className="flex items-center">
                    {lineStyle === 'solid' && (
                      <div
                        className="w-6 h-1 rounded"
                        style={{ backgroundColor: entry.color }}
                      />
                    )}
                    {lineStyle === 'dashed' && (
                      <div className="w-6 flex space-x-0.5">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1 rounded"
                            style={{ backgroundColor: entry.color }}
                          />
                        ))}
                      </div>
                    )}
                    {lineStyle === 'dotted' && (
                      <div className="w-6 flex space-x-0.5">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className="w-0.5 h-0.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${isVisible ? 'text-gray-900' : 'text-gray-500'}`}>
                    {entry.value}
                  </span>
                  {!isVisible && (
                    <span className="text-xs text-gray-400">(hidden)</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Performance Dashboard</h1>
              <p className="text-sm text-gray-600">Analyze inventory, procurement, and sales trends</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Upload and Selection Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* File Upload */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Data Upload
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Excel File
                  </>
                )}
              </button>
              {uploadedFileName && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-green-700 font-medium">File loaded successfully</p>
                  </div>
                  <p className="text-xs text-green-600 mt-1 truncate" title={uploadedFileName}>
                    {uploadedFileName}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {transformedData.length} data points processed
                  </p>
                </div>
              )}
            </div>

            {/* Enhanced Product Selector */}
            {availableProducts.length > 0 && (
              <div className="lg:col-span-2" ref={dropdownRef}>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Product Selection ({selectedProducts.length}/{availableProducts.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedProducts(availableProducts)
                        const newVis: any = {}
                        availableProducts.forEach(product => {
                          newVis[`${product}_inventory`] = true
                          newVis[`${product}_procurementAmount`] = true
                          newVis[`${product}_salesAmount`] = true
                        })
                        setLineVisibility(newVis)
                      }}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProducts([])
                        setLineVisibility({})
                      }}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                {/* Search Input */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Selected Products Display */}
                {selectedProducts.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-2 bg-gray-50 rounded-md border">
                      {selectedProducts.map(product => (
                        <span
                          key={product}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap"
                        >
                          <span className="truncate max-w-32" title={product}>{product}</span>
                          <button
                            onClick={() => handleRemoveProduct(product)}
                            className="ml-1 hover:bg-blue-200 rounded-full p-0.5 flex-shrink-0"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scrollable Product List */}
                {showDropdown && (
                  <div className="border border-gray-300 rounded-md shadow-lg bg-white max-h-48 overflow-y-auto">
                    <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b text-xs font-medium text-gray-600">
                      Click to select/deselect products
                    </div>
                    {filteredProducts.map(product => (
                      <div
                        key={product}
                        onClick={() => {
                          handleProductSelect(product)
                          setSearchTerm('')
                        }}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between text-sm border-b border-gray-100 last:border-b-0 ${
                          selectedProducts.includes(product) ? 'bg-blue-50 text-blue-900' : 'text-gray-700'
                        }`}
                      >
                        <span className="truncate">{product}</span>
                        {selectedProducts.includes(product) && (
                          <span className="text-blue-600 font-medium ml-2">✓</span>
                        )}
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="px-3 py-4 text-center text-gray-500 text-sm">
                        No products found matching "{searchTerm}"
                      </div>
                    )}
                  </div>
                )}
                
                {!showDropdown && (
                  <button
                    onClick={() => setShowDropdown(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Click to browse {availableProducts.length} available products...
                  </button>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start space-x-3">
                <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.35 14.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-900">Upload Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <div className="mt-2 text-xs text-red-600">
                    <p>Please ensure your Excel file contains the following columns:</p>
                    <ul className="list-disc ml-4 mt-1">
                      <li>ID, Product Name, Opening Inventory</li>
                      <li>Procurement Qty (Day 1), Procurement Price (Day 1)</li>
                      <li>Sales Qty (Day 1), Sales Price (Day 1)</li>
                      <li>Similar columns for Day 2 and Day 3</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Statistics Panel - Only show when products are selected */}
        {selectedProducts.length > 0 && transformedData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {(() => {
              const selectedData = transformedData.filter(item => 
                selectedProducts.includes(item.productName)
              )
              const totalInventory = selectedData.reduce((sum, item) => sum + item.inventory, 0) / selectedData.length
              const totalProcurement = selectedData.reduce((sum, item) => sum + item.procurementAmount, 0)
              const totalSales = selectedData.reduce((sum, item) => sum + item.salesAmount, 0)
              const netFlow = totalSales - totalProcurement

              return (
                <>
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Inventory</h3>
                    <p className="text-xl font-bold text-purple-600">
                      {Math.round(totalInventory).toLocaleString()} units
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Procurement</h3>
                    <p className="text-xl font-bold text-blue-600">
                      ${totalProcurement.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Sales</h3>
                    <p className="text-xl font-bold text-green-600">
                      ${totalSales.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Net Flow</h3>
                    <p className={`text-xl font-bold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${netFlow.toLocaleString()}
                    </p>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {/* Flexible Chart Container */}
        <div className="bg-white rounded-lg shadow-sm border flex flex-col">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">
              Product Performance: Inventory vs. Procurement vs. Sales
            </h2>
            {selectedProducts.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Analyzing {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} across 3 days
              </p>
            )}
          </div>
          
          {/* Fixed Chart Area */}
          <div className="h-[500px] p-4 flex-shrink-0">
            {selectedProducts.length > 0 && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 80, left: 80, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#666"
                    style={{ fontSize: '14px' }}
                    axisLine={{ stroke: '#ccc' }}
                    tickLine={{ stroke: '#ccc' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    stroke="#666"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Inventory Level (Units)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `${value.toLocaleString()}`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#666"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Monetary Value ($)', angle: 90, position: 'insideRight' }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {renderLines}
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl text-gray-300 mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {availableProducts.length === 0 
                      ? "Upload an Excel file to begin"
                      : "Please select one or more products from above to begin."
                    }
                  </h3>
                  <p className="text-gray-600">
                    The chart will display inventory trends alongside procurement and sales values.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Flexible Legend Area - Only show when there's data */}
          {selectedProducts.length > 0 && chartData.length > 0 && (
            <div className="p-4 border-t border-gray-200 flex-grow min-h-0">
              <CustomLegend payload={(() => {
                const legendData: any[] = []
                selectedProducts.forEach(product => {
                  const baseColor = PRODUCT_COLORS[selectedProducts.indexOf(product) % PRODUCT_COLORS.length]
                  
                  legendData.push({
                    dataKey: `${product}_inventory`,
                    value: `${product} - Inventory`,
                    color: baseColor
                  })
                  
                  legendData.push({
                    dataKey: `${product}_procurementAmount`,
                    value: `${product} - Procurement`,
                    color: baseColor
                  })
                  
                  legendData.push({
                    dataKey: `${product}_salesAmount`,
                    value: `${product} - Sales`,
                    color: baseColor
                  })
                })
                return legendData
              })()} />
            </div>
          )}
        </div>

        {/* Chart Instructions - Always Visible */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-2">Chart Legend:</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Solid lines:</strong> Inventory levels (left axis, units)</li>
                <li>• <strong>Dashed lines:</strong> Procurement amounts (right axis, currency)</li>
                <li>• <strong>Dotted lines:</strong> Sales amounts (right axis, currency)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-2">Interactions:</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Click legend items</strong> to toggle line visibility</li>
                <li>• <strong>Hover over data points</strong> for precise values</li>
                <li>• Each product has a unique color across all three metrics</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
