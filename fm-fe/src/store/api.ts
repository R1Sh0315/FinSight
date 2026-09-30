import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Company {
  symbol: string;
  name: string;
  exchange: string;
  marketCap: number;
  currentPrice: number;
}

export interface ForecastResult {
  symbol: string;
  forecast: string;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:5000/api/v1/',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Investments', 'Watchlist'],
  endpoints: (builder) => ({
    getAllCompanies: builder.query<{ data: Company[] }, void>({
      query: () => 'companies',
    }),
    getTopCompanies: builder.query<{ data: Company[] }, void>({
      query: () => 'companies/top',
    }),
    getCompany: builder.query<{ data: Company }, string>({
      query: (symbol) => `companies/${symbol}`,
    }),
    getCompanyFinancials: builder.query<{ data: any }, string>({
      query: (symbol) => `companies/${symbol}/financials`,
    }),
    getCompanyForecast: builder.query<{ data: ForecastResult }, string>({
      query: (symbol) => `forecast/${symbol}`,
    }),
    loginGoogle: builder.mutation<{ data: { user: any, token: string } }, string>({
      query: (token) => ({
        url: 'auth/google',
        method: 'POST',
        body: { token },
      }),
    }),
    getInvestments: builder.query<{ data: any[] }, void>({
      query: () => 'investments',
      providesTags: ['Investments'],
    }),
    addInvestment: builder.mutation<{ data: any }, any>({
      query: (body) => ({
        url: 'investments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Investments'],
    }),
    updateInvestment: builder.mutation<{ data: any }, { id: string, shares: number, averagePrice: number }>({
      query: ({ id, ...body }) => ({
        url: `investments/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Investments'],
    }),
    getWatchlist: builder.query<{ data: any[] }, void>({
      query: () => 'auth/watchlist',
      providesTags: ['Watchlist'],
    }),
    addToWatchlist: builder.mutation<{ data: string[] }, string>({
      query: (symbol) => ({
        url: 'auth/watchlist',
        method: 'POST',
        body: { symbol },
      }),
      invalidatesTags: ['Watchlist'],
    }),
    removeFromWatchlist: builder.mutation<{ data: string[] }, string>({
      query: (symbol) => ({
        url: `auth/watchlist/${symbol}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Watchlist'],
    }),
    getLivePrices: builder.query<{ data: Record<string, { price: number, change: number, changePercent: number }> }, string[]>({
      query: (symbols) => `market/prices?symbols=${encodeURIComponent(symbols.join(','))}`,
    }),
    getIndianNews: builder.query<{ data: Array<{ title: string, link: string, description: string, pubDate: string, source: string, sentiment: string }> }, void>({
      query: () => 'market/news',
    }),
    analyzeNews: builder.mutation<{ data: { analysis: string } }, { title: string, description: string }>({
      query: (body) => ({
        url: 'market/analyze-news',
        method: 'POST',
        body,
      }),
    }),
    getAnnualReport: builder.query<{ data: { url: string, title: string }[] }, string>({
      query: (symbol) => `market/annual-report/${encodeURIComponent(symbol)}`,
    }),
    analyzeCompany: builder.mutation<{ data: { analysis: string } }, { symbol: string }>({
      query: (body) => ({
        url: 'market/analyze-company',
        method: 'POST',
        body,
      }),
    }),
    searchSymbols: builder.query<{ data: Array<{ symbol: string, name: string, assetClass: string }> }, string>({
      query: (q) => `market/search?q=${encodeURIComponent(q)}`,
    }),
  }),
});

export const {
  useGetAllCompaniesQuery,
  useGetTopCompaniesQuery,
  useGetCompanyQuery,
  useGetCompanyFinancialsQuery,
  useGetCompanyForecastQuery,
  useLoginGoogleMutation,
  useGetInvestmentsQuery,
  useAddInvestmentMutation,
  useUpdateInvestmentMutation,
  useGetWatchlistQuery,
  useAddToWatchlistMutation,
  useRemoveFromWatchlistMutation,
  useGetLivePricesQuery,
  useGetIndianNewsQuery,
  useAnalyzeNewsMutation,
  useGetAnnualReportQuery,
  useLazyGetAnnualReportQuery,
  useAnalyzeCompanyMutation,
  useSearchSymbolsQuery,
} = api;
