"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { LIST_MODAL_CLOSE_BTN, LIST_PAGE_HEADER_ACTION, LIST_PAGE_HEADER_CANCEL } from "@/lib/list-page-styles"

interface CategoryFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: CategoryFormData) => void
}

interface CategoryFormData {
  categoryName: string
  categoryDescription: string
  categoryType: string
  categoryStatus: string
  basePrice: string
  icon: File | null
}

export default function CategoryForm({ isOpen, onClose, onSubmit }: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    categoryName: "",
    categoryDescription: "",
    categoryType: "",
    categoryStatus: "",
    basePrice: "",
    icon: null,
  })
  const [iconPreview, setIconPreview] = useState<string>("")
  const [iconError, setIconError] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setIconError("File size must be less than 2MB")
      return
    }

    // Validate file type
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setIconError("Only PNG and JPG files are allowed")
      return
    }

    // Read and display image
    const reader = new FileReader()
    reader.onload = (event) => {
      setIconPreview(event.target?.result as string)
      setFormData((prev) => ({ ...prev, icon: file }))
      setIconError("Icon uploaded successfully ✓")
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form Data:", formData)
    if (onSubmit) {
      onSubmit(formData)
    }
    toast.success("Category created successfully!")
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-200 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Add Category</h1>
            <p className="text-sm text-gray-600 font-medium">Create a new album or frame category</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={LIST_MODAL_CLOSE_BTN}
            aria-label="Close"
          >
            X
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-8 py-8">
          {/* Info Box */}
          <div className="bg-gray-100 border-l-4 border-indigo-500 px-4 py-4 rounded-lg mb-6 text-sm text-gray-700 font-medium">
            <span className="font-bold mr-2">ℹ</span>
            <span>Categories help organize your inventory. Give it a memorable name and description.</span>
          </div>

          {/* Category Name */}
          <div className="mb-7">
            <label htmlFor="categoryName" className="block text-sm font-semibold text-gray-800 mb-2.5">
              Category Name <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="text"
              id="categoryName"
              name="categoryName"
              value={formData.categoryName}
              onChange={handleInputChange}
              placeholder="e.g., Premium Wedding Albums"
              required
              maxLength={100}
              className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl transition-all focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
            <div className="text-sm text-gray-600 mt-2 font-medium">
              Unique name for this category (max 100 characters)
            </div>
          </div>

          {/* Description */}
          <div className="mb-7">
            <label htmlFor="categoryDescription" className="block text-sm font-semibold text-gray-800 mb-2.5">
              Description <span className="text-red-600 font-bold">*</span>
            </label>
            <textarea
              id="categoryDescription"
              name="categoryDescription"
              value={formData.categoryDescription}
              onChange={handleInputChange}
              placeholder="Describe this category, materials used, typical sizes, etc."
              required
              maxLength={500}
              className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl transition-all focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 min-h-[100px] resize-y"
            />
            <div className="text-sm text-gray-600 mt-2 font-medium">Max 500 characters</div>
          </div>

          {/* Type & Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-7">
            <div>
              <label htmlFor="categoryType" className="block text-sm font-semibold text-gray-800 mb-2.5">
                Type <span className="text-red-600 font-bold">*</span>
              </label>
              <select
                id="categoryType"
                name="categoryType"
                value={formData.categoryType}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl transition-all focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">Select type</option>
                <option value="album">Album</option>
                <option value="frame">Frame</option>
                <option value="both">Both (Album & Frame)</option>
              </select>
            </div>

            <div>
              <label htmlFor="categoryStatus" className="block text-sm font-semibold text-gray-800 mb-2.5">
                Status <span className="text-red-600 font-bold">*</span>
              </label>
              <select
                id="categoryStatus"
                name="categoryStatus"
                value={formData.categoryStatus}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl transition-all focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">Select status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Icon Upload */}
          <div className="mb-7">
            <label className="block text-sm font-semibold text-gray-800 mb-2.5">
              Category Icon <span className="text-red-600 font-bold">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                iconPreview
                  ? "border-gray-400 bg-gray-50"
                  : "border-gray-300 bg-gray-50 hover:border-indigo-500 hover:bg-indigo-50"
              }`}
            >
              <div
                className={`w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-white border border-gray-300 rounded-xl ${
                  iconPreview ? "" : "text-5xl text-gray-300"
                }`}
                style={
                  iconPreview
                    ? {
                        backgroundImage: `url(${iconPreview})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {}
                }
              >
                {!iconPreview && "📷"}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-1.5">Click to upload icon</h4>
                <p className="text-sm text-gray-600">or drag and drop</p>
                <div className="text-xs text-gray-500 mt-2 font-medium">
                  PNG, JPG up to 2MB (256x256px recommended)
                </div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleIconUpload}
              className="hidden"
            />
            {iconError && (
              <div
                className={`text-sm mt-2 font-medium ${
                  iconError.includes("successfully") ? "text-green-600" : "text-red-600"
                }`}
              >
                {iconError}
              </div>
            )}
          </div>

          {/* Base Price */}
          <div className="mb-0">
            <label htmlFor="basePrice" className="block text-sm font-semibold text-gray-800 mb-2.5">
              Base Price (LKR)
            </label>
            <input
              type="number"
              id="basePrice"
              name="basePrice"
              value={formData.basePrice}
              onChange={handleInputChange}
              placeholder="e.g., 350"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl transition-all focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
            <div className="text-sm text-gray-600 mt-2 font-medium">
              Optional: Set a starting price for items in this category
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-200 flex flex-wrap items-center justify-center gap-3 bg-gray-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className={`${LIST_PAGE_HEADER_CANCEL} appearance-none`}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className={`${LIST_PAGE_HEADER_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-60`}
          >
            Create Category
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  )
}