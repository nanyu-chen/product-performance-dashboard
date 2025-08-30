'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine
} from 'recharts'

interface ProductData {
  id: number
  productName: string
  inventory: number
  procurementAmount: number
  salesAmount: number
  date: string
  formattedDate?: string
}

interface ChartDataPoint {
  date: string
  formattedDate: string
  [key: string]: string | number
}

interface DateRange {
  startDate: string
  endDate: string
}

export default function DashboardPage() {
  const [products, setProducts] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [allProductData, setAllProductData] = useState<Record<string, ProductData[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' })
  const [showComparison, setShowComparison] = useState(false)
  const [hoveredData, setHoveredData] = useState<any>(null)
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/data')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
        if (data.length > 0) {
          setSelectedProducts([data[0]])
        }
      } else {
        setError('Failed to fetch products')
      }
    } catch (error) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const fetchProductData = async (productName: string) => {
    try {
      const response = await fetch(`/api/data?product=${encodeURIComponent(productName)}`)
      if (response.ok) {
        const data = await response.json()
        return data.map((item: ProductData) => ({
          ...item,
          formattedDate: new Date(item.date).toLocaleDateString()
        }))
      } else {
        setError('Failed to fetch product data')
        return []
      }
    } catch (error) {
      setError('Network error')
      return []
    }
  }

  const fetchAllSelectedProductsData = async () => {
    const dataPromises = selectedProducts.map(async (product) => {
      const data = await fetchProductData(product)
      return { product, data }
    })
    
    const results = await Promise.all(dataPromises)
    const newData: Record<string, ProductData[]> = {}
    
    results.forEach(({ product, data }) => {
      newData[product] = data
    })
    
    setAllProductData(newData)
    
    // Set date range based on available data
    if (Object.keys(newData).length > 0) {
      const allDates = Object.values(newData).flat().map(item => item.date)
      if (allDates.length > 0) {
        const sortedDates = allDates.sort()
        setDateRange({
          startDate: sortedDates[0].split('T')[0],
          endDate: sortedDates[sortedDates.length - 1].split('T')[0]
        })
      }
    }
  }

  // Process and combine data for visualization
  const chartData = useMemo(() => {
    if (selectedProducts.length === 0) return []
    
    const dateMap = new Map<string, ChartDataPoint>()
    
    selectedProducts.forEach((product) => {
      const productData = allProductData[product] || []
      
      productData.forEach((item) => {
        const dateKey = item.date.split('T')[0]
        
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, {
            date: dateKey,
            formattedDate: new Date(item.date).toLocaleDateString()
          })
        }
        
        const point = dateMap.get(dateKey)!
        
        if (selectedProducts.length === 1) {
          // Single product view - show absolute values
          point.inventory = item.inventory
          point.procurementAmount = item.procurementAmount
          point.salesAmount = item.salesAmount
        } else {
          // Multi-product view - show per-product values
          point[`${product}_inventory`] = item.inventory
          point[`${product}_procurement`] = item.procurementAmount
          point[`${product}_sales`] = item.salesAmount
        }
      })
    })
    
    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [selectedProducts, allProductData])

  // Filter data by date range
  const filteredChartData = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return chartData
    
    return chartData.filter(item => {
      const itemDate = new Date(item.date)
      const start = new Date(dateRange.startDate)
      const end = new Date(dateRange.endDate)
      return itemDate >= start && itemDate <= end
    })
  }, [chartData, dateRange])

  // Generate chart lines based on selected products
  const chartLines = useMemo(() => {
    const colors = [
      { inventory: '#8884d8', procurement: '#82ca9d', sales: '#ffc658' },
      { inventory: '#ff7c7c', procurement: '#8dd1e1', sales: '#d084d0' },
      { inventory: '#82d982', procurement: '#ffb347', sales: '#87ceeb' },
      { inventory: '#dda0dd', procurement: '#98fb98', sales: '#f0e68c' }
    ]
    
    if (selectedProducts.length === 1) {
      return [
        <Line
          key="inventory"
          type="monotone"
          dataKey="inventory"
          stroke={colors[0].inventory}
          strokeWidth={2}
          name="Daily Inventory"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />,
        <Line
          key="procurement"
          type="monotone"
          dataKey="procurementAmount"
          stroke={colors[0].procurement}
          strokeWidth={2}
          name="Daily Procurement Amount"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />,
        <Line
          key="sales"
          type="monotone"
          dataKey="salesAmount"
          stroke={colors[0].sales}
          strokeWidth={2}
          name="Daily Sales Amount"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      ]
    } else {
      const lines: React.ReactElement[] = []
      selectedProducts.forEach((product, index) => {
        const colorSet = colors[index % colors.length]
        lines.push(
          <Line
            key={`${product}_inventory`}
            type="monotone"
            dataKey={`${product}_inventory`}
            stroke={colorSet.inventory}
            strokeWidth={2}
            name={`${product} - Inventory`}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />,
          <Line
            key={`${product}_procurement`}
            type="monotone"
            dataKey={`${product}_procurement`}
            stroke={colorSet.procurement}
            strokeWidth={2}
            name={`${product} - Procurement`}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />,
          <Line
            key={`${product}_sales`}
            type="monotone"
            dataKey={`${product}_sales`}
            stroke={colorSet.sales}
            strokeWidth={2}
            name={`${product} - Sales`}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        )
      })
      return lines
    }
  }, [selectedProducts])

  // Custom tooltip for enhanced interactivity
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{`Date: ${new Date(label).toLocaleDateString()}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const handleProductToggle = (product: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(product)) {
        return prev.filter(p => p !== product)
      } else {
        return [...prev, product]
      }
    })
  }

  const selectAllProducts = () => {
    setSelectedProducts(products)
  }

  const clearAllProducts = () => {
    setSelectedProducts([])
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedProducts.length > 0) {
      fetchAllSelectedProductsData()
    }
  }, [selectedProducts])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Product Performance Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/upload')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Upload Data
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-gray-900 mb-4">
              No Data Available
            </h2>
            <p className="text-gray-600 mb-6">
              Please upload your data to view the dashboard.
            </p>
            <button
              onClick={() => router.push('/upload')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Upload Data
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Controls Panel */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Product Multi-Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Products ({selectedProducts.length} selected)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                    <div className="flex space-x-2 mb-2">
                      <button
                        onClick={selectAllProducts}
                        className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearAllProducts}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Clear All
                      </button>
                    </div>
                    {products.map((product) => (
                      <label key={product} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product)}
                          onChange={() => handleProductToggle(product)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-900">{product}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Date Range Filter
                  </label>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600">Start Date</label>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">End Date</label>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Chart Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Display Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showComparison}
                        onChange={(e) => setShowComparison(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-900">Show Comparison Mode</span>
                    </label>
                    <div className="text-xs text-gray-600">
                      Data Points: {filteredChartData.length}
                    </div>
                    <div className="text-xs text-gray-600">
                      Products: {selectedProducts.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Visualization */}
            {selectedProducts.length > 0 && filteredChartData.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedProducts.length === 1 
                        ? `${selectedProducts[0]} - Performance Metrics`
                        : `Multi-Product Comparison (${selectedProducts.length} products)`
                      }
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Interactive line chart showing daily inventory, procurement, and sales amounts
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>Period: {new Date(filteredChartData[0]?.date).toLocaleDateString()} - {new Date(filteredChartData[filteredChartData.length - 1]?.date).toLocaleDateString()}</div>
                    <div>{filteredChartData.length} data points</div>
                  </div>
                </div>
                
                <div className="h-[600px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={filteredChartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 80,
                      }}
                      onMouseMove={(data) => setHoveredData(data)}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={Math.max(1, Math.floor(filteredChartData.length / 10))}
                      />
                      <YAxis 
                        tickFormatter={(value) => value.toLocaleString()}
                        domain={['dataMin', 'dataMax']}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="line"
                      />
                      
                      {chartLines}
                      
                      {/* Brush for zooming */}
                      <Brush 
                        dataKey="date" 
                        height={30} 
                        stroke="#8884d8"
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend explanation */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Chart Guide:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-700">
                    <div>
                      <span className="font-medium">Daily Inventory:</span> End-of-day inventory levels
                    </div>
                    <div>
                      <span className="font-medium">Daily Procurement:</span> Total monetary value of goods procured (Quantity × Price)
                    </div>
                    <div>
                      <span className="font-medium">Daily Sales:</span> Total monetary value of sales (Quantity × Price)
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    💡 Use the brush control at the bottom to zoom into specific time periods. Hover over data points for detailed values.
                  </p>
                </div>
              </div>
            )}

            {/* Summary Statistics */}
            {selectedProducts.length > 0 && filteredChartData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedProducts.slice(0, 3).map((product) => {
                  const productData = allProductData[product] || []
                  const totalSales = productData.reduce((sum, item) => sum + item.salesAmount, 0)
                  const totalProcurement = productData.reduce((sum, item) => sum + item.procurementAmount, 0)
                  const avgInventory = productData.length > 0 ? productData.reduce((sum, item) => sum + item.inventory, 0) / productData.length : 0
                  
                  return (
                    <div key={product} className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">{product}</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Sales:</span>
                          <span className="text-sm font-medium text-green-600">${totalSales.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Procurement:</span>
                          <span className="text-sm font-medium text-blue-600">${totalProcurement.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Avg Inventory:</span>
                          <span className="text-sm font-medium text-purple-600">{avgInventory.toFixed(0)} units</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm text-gray-600">Net Margin:</span>
                          <span className={`text-sm font-medium ${totalSales - totalProcurement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${(totalSales - totalProcurement).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {selectedProducts.length === 0 && (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-gray-600">Please select at least one product to view the dashboard.</p>
              </div>
            )}

            {selectedProducts.length > 0 && filteredChartData.length === 0 && (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-gray-600">No data available for the selected products and date range.</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
