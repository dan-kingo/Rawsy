import React, { useState, useEffect } from "react";
import "./platformAnalytics.css";
import { MdRefresh, MdWarning, MdInsertChart, MdApartment, MdCheckCircle, MdHourglassEmpty, MdInventory2, MdAttachMoney, MdTrendingUp } from 'react-icons/md';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

function PlatformAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("6months");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("authToken");

      const [overviewRes, suppliersRes, productsRes, trendsRes] = await Promise.all([
        fetch("https://rawsy.onrender.com/api/admin/metrics/overview", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("https://rawsy.onrender.com/api/admin/metrics/top-suppliers?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("https://rawsy.onrender.com/api/admin/metrics/top-products?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("https://rawsy.onrender.com/api/admin/metrics/trends?months=6", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!overviewRes.ok || !suppliersRes.ok || !productsRes.ok || !trendsRes.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const [overview, suppliers, products, trends] = await Promise.all([
        overviewRes.json(),
        suppliersRes.json(),
        productsRes.json(),
        trendsRes.json(),
      ]);

      setStats({
        ...overview.overview,
        topSuppliers: suppliers.topSuppliers,
        topProducts: products.topByOrders,
        revenueChart: trends.revenueChart,
        ordersChart: trends.ordersChart,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="header-content">
          <h1>Platform Analytics</h1>
          <p>Monitor platform performance and key metrics</p>
        </div>
        <div className="header-actions">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-filter"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          <button onClick={fetchAnalytics} className="refresh-button">
            <MdRefresh className="refresh-icon" />
            Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <MdWarning className="error-icon" />
          {error}
        </div>
      )}

      {!stats ? (
        <div className="no-data">
          <div className="no-data-content">
            <MdInsertChart className="no-data-icon" />
            <h3>No Analytics Data</h3>
            <p>Unable to load analytics data at this time</p>
            <button onClick={fetchAnalytics} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="analytics-stats-grid">
            <div className="analytics-card">
              <div className="card-icon total"><MdApartment color="#fff" /></div>
              <div className="card-content">
                <h4>Total Manufacturers</h4>
                <p>{stats.totalManufacturers || 0}</p>
                <span className="card-trend positive">+12% this month</span>
              </div>
            </div>

            <div className="analytics-card">
              <div className="card-icon active"><MdCheckCircle color="#fff"  /></div>
              <div className="card-content">
                <h4>Active Suppliers</h4>
                <p>{stats.activeSuppliers || 0}</p>
                <span className="card-trend positive">+5% this month</span>
              </div>
            </div>

            <div className="analytics-card">
              <div className="card-icon pending"><MdHourglassEmpty color="#fff" /></div>
              <div className="card-content">
                <h4>Pending Suppliers</h4>
                <p>{stats.pendingSuppliers || 0}</p>
                <span className="card-trend negative">-2% this month</span>
              </div>
            </div>

            <div className="analytics-card">
              <div className="card-icon orders"><MdInventory2 color="#fff"  /></div>
              <div className="card-content">
                <h4>Total Orders</h4>
                <p>{stats.totalOrders || 0}</p>
                <span className="card-trend positive">+18% this month</span>
              </div>
            </div>

            <div className="analytics-card">
              <div className="card-icon revenue"><MdAttachMoney color="#fff" /></div>
              <div className="card-content">
                <h4>Total Revenue</h4>
                <p>ETB {stats.revenue ? stats.revenue.toLocaleString() : 0}</p>
                <span className="card-trend positive">+22% this month</span>
              </div>
            </div>

            <div className="analytics-card">
              <div className="card-icon growth"><MdTrendingUp color="#fff" /></div>
              <div className="card-content">
                <h4>Platform Growth</h4>
                <p>+15%</p>
                <span className="card-trend positive">Overall growth rate</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            {/* Revenue Trend Chart */}
            <div className="chart-section">
              <div className="chart-header">
                <h3>Revenue Trend</h3>
                <span className="chart-subtitle">Last 6 months performance</span>
              </div>
              <div className="chart-box">
                {stats.revenueChart && stats.revenueChart.labels && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={stats.revenueChart.labels.map((label, idx) => ({
                        month: label,
                        revenue: stats.revenueChart.values[idx],
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={12}
                        tickFormatter={(value) => `ETB ${value/1000}k`}
                      />
                      <Tooltip 
                        formatter={(value) => [`ETB ${value.toLocaleString()}`, 'Revenue']}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#059669' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Orders Trend Chart */}
            <div className="chart-section">
              <div className="chart-header">
                <h3>Orders Trend</h3>
                <span className="chart-subtitle">Order volume over time</span>
              </div>
              <div className="chart-box">
                {stats.ordersChart && stats.ordersChart.labels && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={stats.ordersChart.labels.map((label, idx) => ({
                        month: label,
                        orders: stats.ordersChart.values[idx],
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="orders" 
                        fill="#2563eb" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top Suppliers */}
            {stats.topSuppliers && stats.topSuppliers.length > 0 && (
              <div className="chart-section">
                <div className="chart-header">
                  <h3>Top Suppliers</h3>
                  <span className="chart-subtitle">By order volume</span>
                </div>
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.topSuppliers}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="supplierName" 
                        stroke="#6b7280"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="orderCount" 
                        fill="#8b5cf6" 
                        name="Orders"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Top Products */}
            {stats.topProducts && stats.topProducts.length > 0 && (
              <div className="chart-section">
                <div className="chart-header">
                  <h3>Top Products</h3>
                  <span className="chart-subtitle">By quantity ordered</span>
                </div>
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.topProducts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#6b7280"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="orderedQty" 
                        fill="#f59e0b" 
                        name="Ordered Quantity"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PlatformAnalytics;