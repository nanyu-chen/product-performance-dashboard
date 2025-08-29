import * as XLSX from 'xlsx'

export interface RawProductData {
  ID: string
  'Product Name': string
  'Opening Inventory': number
  'Procurement Qty (Day 1)': number
  'Procurement Price (Day 1)': string
  'Procurement Qty (Day 2)': number
  'Procurement Price (Day 2)': string
  'Procurement Qty (Day 3)': number
  'Procurement Price (Day 3)': string
  'Sales Qty (Day 1)': number
  'Sales Price (Day 1)': string
  'Sales Qty (Day 2)': number
  'Sales Price (Day 2)': string
  'Sales Qty (Day 3)': number
  'Sales Price (Day 3)': string
}

export interface TransformedProductData {
  productId: string
  productName: string
  day: number
  inventory: number
  procurementAmount: number
  salesAmount: number
}

export interface ChartDataPoint {
  day: string
  [key: string]: string | number // Dynamic keys for multiple products
}

export function readExcelFile(file: File): Promise<RawProductData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as RawProductData[]
        resolve(jsonData)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsBinaryString(file)
  })
}

// Critical function to convert currency strings to floats
function convertCurrencyStringToFloat(currencyString: string | number): number {
  if (typeof currencyString === 'number') return currencyString
  if (!currencyString || currencyString === '') return 0
  
  // Remove $ symbol and commas, then parse to float
  const cleanString = currencyString.toString().replace(/[$,]/g, '')
  const parsed = parseFloat(cleanString)
  return isNaN(parsed) ? 0 : parsed
}

export function transformToLongFormat(rawData: RawProductData[]): TransformedProductData[] {
  const transformedData: TransformedProductData[] = []
  
  rawData.forEach((product) => {
    const openingInventory = product['Opening Inventory'] || 0
    let cumulativeProcurement = 0
    let cumulativeSales = 0

    // Loop through each day (1, 2, 3)
    for (let day = 1; day <= 3; day++) {
      // 1. Get daily values
      const procQty = product[`Procurement Qty (Day ${day})` as keyof RawProductData] as number || 0
      const procPrice = convertCurrencyStringToFloat(product[`Procurement Price (Day ${day})` as keyof RawProductData] as string)
      const salesQty = product[`Sales Qty (Day ${day})` as keyof RawProductData] as number || 0
      const salesPrice = convertCurrencyStringToFloat(product[`Sales Price (Day ${day})` as keyof RawProductData] as string)

      // 2. Update cumulative values
      cumulativeProcurement += procQty
      cumulativeSales += salesQty

      // 3. Calculate inventory for the end of this day
      const dailyInventory = openingInventory + cumulativeProcurement - cumulativeSales

      // 4. Calculate daily monetary amounts
      const procAmount = procQty * procPrice
      const salesAmount = salesQty * salesPrice

      // 5. Create a new data point for the chart
      transformedData.push({
        productId: product['ID'],
        productName: product['Product Name'],
        day: day,
        inventory: dailyInventory,
        procurementAmount: procAmount,
        salesAmount: salesAmount
      })
    }
  })
  
  return transformedData
}

export function prepareChartData(
  transformedData: TransformedProductData[],
  selectedProducts: string[],
  selectedDays: number[]
): ChartDataPoint[] {
  // Filter data based on selections
  const filteredData = transformedData.filter(
    (item) =>
      selectedProducts.includes(item.productName) &&
      selectedDays.includes(item.day)
  )
  
  // Group by day
  const groupedByDay: Record<number, TransformedProductData[]> = {}
  filteredData.forEach((item) => {
    if (!groupedByDay[item.day]) {
      groupedByDay[item.day] = []
    }
    groupedByDay[item.day].push(item)
  })
  
  // Create chart data points
  const chartData: ChartDataPoint[] = []
  
  Object.keys(groupedByDay)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((day) => {
      const dayData: ChartDataPoint = { day: `Day ${day}` }
      
      groupedByDay[day].forEach((item) => {
        const productKey = item.productName
        dayData[`${productKey}_inventory`] = item.inventory
        dayData[`${productKey}_procurementAmount`] = item.procurementAmount
        dayData[`${productKey}_salesAmount`] = item.salesAmount
      })
      
      chartData.push(dayData)
    })
  
  return chartData
}

export function getUniqueProducts(transformedData: TransformedProductData[]): string[] {
  return [...new Set(transformedData.map(item => item.productName))]
}

export function getUniqueDays(transformedData: TransformedProductData[]): number[] {
  return [...new Set(transformedData.map(item => item.day))].sort((a, b) => a - b)
}

export function calculateSummaryStats(
  transformedData: TransformedProductData[],
  selectedProducts: string[],
  selectedDays: number[]
) {
  const filteredData = transformedData.filter(
    (item) =>
      selectedProducts.includes(item.productName) &&
      selectedDays.includes(item.day)
  )
  
  const totalProcurementAmount = filteredData.reduce((sum, item) => sum + item.procurementAmount, 0)
  const totalSalesAmount = filteredData.reduce((sum, item) => sum + item.salesAmount, 0)
  const totalInventory = filteredData.reduce((sum, item) => sum + item.inventory, 0)
  const avgProcurementAmount = filteredData.length > 0 ? totalProcurementAmount / filteredData.length : 0
  const avgSalesAmount = filteredData.length > 0 ? totalSalesAmount / filteredData.length : 0
  
  return {
    totalProcurementAmount,
    totalSalesAmount,
    totalInventory,
    avgProcurementAmount,
    avgSalesAmount,
    netRevenue: totalSalesAmount - totalProcurementAmount
  }
}
