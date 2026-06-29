"use client"

import CategoryForm from "@/components/add-category-form"
import AlbumForm from "@/components/add-albums-form"
import { PAGE_CONTENT, LIST_PAGE_HEADER_ACTION, LIST_PAGE_HEADER_SECONDARY } from "@/lib/list-page-styles"
import { useState } from "react"

export default function Frames() {
  const [activeTab, setActiveTab] = useState("albums")
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false)
  const [isAlbumFormOpen, setIsAlbumFormOpen] = useState(false)

  return (
    <div className={PAGE_CONTENT}>
            {/* Header Section */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Albums & Frames</h1>
                <p className="text-gray-500">Manage album and frame inventory</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryFormOpen(true)}
                  className={`${LIST_PAGE_HEADER_ACTION} appearance-none`}
                >
                  <span className="text-lg">+</span>
                  Add Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "albums") {
                      setIsAlbumFormOpen(true)
                    }
                    // If frames tab, do nothing (no form yet)
                  }}
                  className={`${LIST_PAGE_HEADER_ACTION} appearance-none`}
                >
                  <span className="text-lg">+</span>
                  {activeTab === "albums" ? "Add Albums" : "Add Framing"}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("albums")}
                className={`pb-3 px-1 font-medium ${activeTab === "albums"
                    ? "text-gray-900 border-b-2 border-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                Albums
              </button>
              <button
                onClick={() => setActiveTab("frames")}
                className={`pb-3 px-1 font-medium ${activeTab === "frames"
                    ? "text-gray-900 border-b-2 border-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                Frames
              </button>
            </div>

            {/* Albums View */}
            {activeTab === "albums" && (
              <>
                {/* Album Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Classic Leather Album */}
                  <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-4xl">📕</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Classic Leather Album</h3>
                    <p className="text-sm text-gray-500 mb-4">10×10" • 20 pages</p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xl font-bold text-gray-900">LKR 350</span>
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                        8 in stock
                      </span>
                    </div>
                    <button type="button" className={`${LIST_PAGE_HEADER_SECONDARY} w-full appearance-none`}>
                      Manage Stock
                    </button>
                  </div>

                  {/* Premium Linen Album */}
                  <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-4xl">📗</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Premium Linen Album</h3>
                    <p className="text-sm text-gray-500 mb-4">12×12" • 30 pages</p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xl font-bold text-gray-900">LKR 450</span>
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                        5 in stock
                      </span>
                    </div>
                    <button type="button" className={`${LIST_PAGE_HEADER_SECONDARY} w-full appearance-none`}>
                      Manage Stock
                    </button>
                  </div>

                  {/* Modern Acrylic Album */}
                  <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-4xl">📘</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Modern Acrylic Album</h3>
                    <p className="text-sm text-gray-500 mb-4">10×10" • 25 pages</p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xl font-bold text-gray-900">LKR 520</span>
                      </div>
                      <span className="bg-red-100 text-red-700 text-xs font-medium px-3 py-1 rounded-full">
                        3 in stock
                      </span>
                    </div>
                    <button type="button" className={`${LIST_PAGE_HEADER_SECONDARY} w-full appearance-none`}>
                      Manage Stock
                    </button>
                  </div>

                  {/* Vintage Velvet Album */}
                  <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-4xl">📙</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Vintage Velvet Album</h3>
                    <p className="text-sm text-gray-500 mb-4">8×8" • 15 pages</p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xl font-bold text-gray-900">LKR 280</span>
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                        12 in stock
                      </span>
                    </div>
                    <button type="button" className={`${LIST_PAGE_HEADER_SECONDARY} w-full appearance-none`}>
                      Manage Stock
                    </button>
                  </div>
                </div>

                {/* Albums Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Album ID</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Client</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Type</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Size</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Pages</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Qty</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Total (LKR)</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Deadline</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Status</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {[1, 2, 3, 4].map((item) => (
                          <tr key={item} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-6 text-sm font-medium text-gray-900">ALBM-001</td>
                            <td className="py-4 px-6 text-sm text-gray-700">Johnson Family</td>
                            <td className="py-4 px-6 text-sm text-gray-700">Classic Leather</td>
                            <td className="py-4 px-6 text-sm text-gray-700">24×36"</td>
                            <td className="py-4 px-6 text-sm text-gray-700">20</td>
                            <td className="py-4 px-6 text-sm text-gray-700">2</td>
                            <td className="py-4 px-6 text-sm text-gray-700">280</td>
                            <td className="py-4 px-6 text-sm text-gray-700">1/10/2026</td>
                            <td className="py-4 px-6">
                              <span className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">
                                Printing
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <button className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Frames View */}
            {activeTab === "frames" && (
              <>
                {/* Frame Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {/* Classic Black Frame */}
                  <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-4xl">🖼️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Classic Black Frame</h3>
                    <p className="text-sm text-gray-500 mb-4">Sizes: 5×7", 8×10", 11×14"</p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xl font-bold text-gray-900">From LKR 45</span>
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                        24 in stock
                      </span>
                    </div>
                    <button type="button" className={`${LIST_PAGE_HEADER_SECONDARY} w-full appearance-none`}>
                      Manage Stock
                    </button>
                  </div>

                  {/* Rustic Barnwood Frame */}
                  <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-4xl">🪵</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Rustic Barnwood Frame</h3>
                    <p className="text-sm text-gray-500 mb-4">Sizes: 8×10", 11×14", 16×20"</p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xl font-bold text-gray-900">From LKR 65</span>
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                        18 in stock
                      </span>
                    </div>
                    <button type="button" className={`${LIST_PAGE_HEADER_SECONDARY} w-full appearance-none`}>
                      Manage Stock
                    </button>
                  </div>

                  {/* Modern White Frame */}
                  <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 bg-white border-4 border-gray-900 rounded-lg mb-4"></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Modern White Frame</h3>
                    <p className="text-sm text-gray-500 mb-4">Sizes: 5×7", 8×10", 11×14"</p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xl font-bold text-gray-900">From LKR 40</span>
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                        30 in stock
                      </span>
                    </div>
                    <button type="button" className={`${LIST_PAGE_HEADER_SECONDARY} w-full appearance-none`}>
                      Manage Stock
                    </button>
                  </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Frame ID</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Client</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Type</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Size</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Qty</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Total (LKR)</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Deadline</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Status</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {[1, 2, 3, 4].map((item) => (
                          <tr key={item} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-6 text-sm font-medium text-gray-900">FRM-001</td>
                            <td className="py-4 px-6 text-sm text-gray-700">Johnson Family</td>
                            <td className="py-4 px-6 text-sm text-gray-700">Classic Leather</td>
                            <td className="py-4 px-6 text-sm text-gray-700">24×36"</td>
                            <td className="py-4 px-6 text-sm text-gray-700">2</td>
                            <td className="py-4 px-6 text-sm text-gray-700">280</td>
                            <td className="py-4 px-6 text-sm text-gray-700">1/10/2026</td>
                            <td className="py-4 px-6">
                              <span className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">
                                Printing
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <button className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={isCategoryFormOpen}
        onClose={() => setIsCategoryFormOpen(false)}
        onSubmit={(data) => {
          console.log("Category data:", data)
          // Handle form submission here
        }}
      />

      {/* Album Form Modal */}
      <AlbumForm
        isOpen={isAlbumFormOpen}
        onClose={() => setIsAlbumFormOpen(false)}
        onSubmit={(data) => {
          console.log("Album data:", data)
          // Handle form submission here
        }}
      />
    </div>
  );
}