"use client"

import { useState } from "react"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"
import { LIST_MODAL_CLOSE_BTN, LIST_PAGE_HEADER_ACTION, LIST_PAGE_HEADER_CANCEL } from "@/lib/list-page-styles"

interface AlbumFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: AlbumFormData) => void
}

interface AlbumFormData {
  type: string
  clientName: string
  sessionDate: string
  size: string
  pages: string
  copies: string
  notes: string
}

export default function AlbumForm({ isOpen, onClose, onSubmit }: AlbumFormProps) {
  const [formData, setFormData] = useState<AlbumFormData>({
    type: "wedding",
    clientName: "",
    sessionDate: "",
    size: "8x8",
    pages: "",
    copies: "1",
    notes: "",
  })
  const [quantity, setQuantity] = useState(1)
  const basePrice = 5500

  if (!isOpen) return null

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === "copies") {
      setQuantity(parseInt(value) || 1)
    }
  }

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const decreaseQty = () => {
    if (quantity > 1) {
      const newQty = quantity - 1
      setQuantity(newQty)
      setFormData((prev) => ({ ...prev, copies: newQty.toString() }))
    }
  }

  const increaseQty = () => {
    if (quantity < 10) {
      const newQty = quantity + 1
      setQuantity(newQty)
      setFormData((prev) => ({ ...prev, copies: newQty.toString() }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Album Form Data:", formData)
    if (onSubmit) {
      onSubmit(formData)
    }
    toast.success("Album created successfully!")
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const sizeMap: { [key: string]: string } = {
    "8x8": "8×8\"",
    "10x10": "10×10\"",
    "12x12": "12×12\"",
    "a4": "A4",
  }

  const totalPrice = basePrice * quantity

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="px-7 py-7 border-b border-gray-200 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Add Album</h1>
            <p className="text-sm text-gray-600 font-medium">Create a new album</p>
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
        <form onSubmit={handleSubmit} className="px-7 py-7">
          {/* Album Type */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Album Type <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <input
                  type="radio"
                  id="type-wedding"
                  name="type"
                  value="wedding"
                  checked={formData.type === "wedding"}
                  onChange={() => handleRadioChange("type", "wedding")}
                  className="hidden"
                />
                <label
                  htmlFor="type-wedding"
                  className={`flex flex-col items-center justify-center p-3.5 border-2 rounded-lg cursor-pointer transition-all min-h-[90px] ${formData.type === "wedding"
                      ? "border-gray-800 bg-gray-100"
                      : "border-gray-300 bg-gray-50"
                    }`}
                >
                  <span className="text-3xl mb-1.5">💒</span>
                  <span className="text-xs font-semibold text-gray-800">Wedding</span>
                </label>
              </div>
              <div>
                <input
                  type="radio"
                  id="type-family"
                  name="type"
                  value="family"
                  checked={formData.type === "family"}
                  onChange={() => handleRadioChange("type", "family")}
                  className="hidden"
                />
                <label
                  htmlFor="type-family"
                  className={`flex flex-col items-center justify-center p-3.5 border-2 rounded-lg cursor-pointer transition-all min-h-[90px] ${formData.type === "family"
                      ? "border-gray-800 bg-gray-100"
                      : "border-gray-300 bg-gray-50"
                    }`}
                >
                  <span className="text-3xl mb-1.5">👨‍👩‍👧‍👦</span>
                  <span className="text-xs font-semibold text-gray-800">Family</span>
                </label>
              </div>
              <div>
                <input
                  type="radio"
                  id="type-other"
                  name="type"
                  value="other"
                  checked={formData.type === "other"}
                  onChange={() => handleRadioChange("type", "other")}
                  className="hidden"
                />
                <label
                  htmlFor="type-other"
                  className={`flex flex-col items-center justify-center p-3.5 border-2 rounded-lg cursor-pointer transition-all min-h-[90px] ${formData.type === "other"
                      ? "border-gray-800 bg-gray-100"
                      : "border-gray-300 bg-gray-50"
                    }`}
                >
                  <span className="text-3xl mb-1.5">📸</span>
                  <span className="text-xs font-semibold text-gray-800">Other</span>
                </label>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Client Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                placeholder="Enter name"
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg transition-all focus:outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Session Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                name="sessionDate"
                value={formData.sessionDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg transition-all focus:outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200"
              />
            </div>
          </div>

          {/* Size Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Album Size <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["8x8", "10x10", "12x12", "a4"].map((size) => (
                <div key={size}>
                  <input
                    type="radio"
                    id={`size-${size}`}
                    name="size"
                    value={size}
                    checked={formData.size === size}
                    onChange={() => handleRadioChange("size", size)}
                    className="hidden"
                  />
                  <label
                    htmlFor={`size-${size}`}
                    className={`flex items-center justify-center px-2.5 py-2.5 border rounded-md cursor-pointer text-xs font-semibold transition-all ${formData.size === size
                        ? "border-gray-800 bg-gray-800 text-white"
                        : "border-gray-300 bg-white text-gray-700"
                      }`}
                  >
                    {sizeMap[size]}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Pages & Copies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Pages <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                name="pages"
                value={formData.pages}
                onChange={handleInputChange}
                placeholder="e.g., 20"
                min="10"
                max="100"
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg transition-all focus:outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Number of Copies <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                name="copies"
                value={formData.copies}
                onChange={handleInputChange}
                placeholder="1"
                min="1"
                max="10"
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg transition-all focus:outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-gray-100 px-4 py-4 rounded-lg mb-6 border-l-4 border-gray-800">
            <div className="text-xs font-bold text-gray-700 uppercase mb-1">Album Size</div>
            <div className="text-base font-bold text-gray-900">{sizeMap[formData.size]}</div>
          </div>

          {/* Quantity Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 px-4 py-4 rounded-lg text-center border border-gray-200">
              <div className="text-xs font-bold text-gray-600 uppercase mb-2">Quantity</div>
              <div className="text-3xl font-bold text-gray-800 mb-2">{quantity}</div>
              <div className="flex gap-1.5 justify-center">
                <button
                  type="button"
                  onClick={decreaseQty}
                  className="w-8 h-8 border border-gray-300 bg-white rounded-md font-semibold text-gray-800 hover:border-gray-800 hover:bg-gray-800 hover:text-white transition-all"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={increaseQty}
                  className="w-8 h-8 border border-gray-300 bg-white rounded-md font-semibold text-gray-800 hover:border-gray-800 hover:bg-gray-800 hover:text-white transition-all"
                >
                  +
                </button>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 rounded-lg text-center border border-gray-200">
              <div className="text-xs font-bold text-gray-600 uppercase mb-2">Total Price (LKR)</div>
              <div className="text-3xl font-bold text-gray-800">{formatPrice(totalPrice)}</div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-0">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Special Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Add any special requests..."
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg transition-all focus:outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200 min-h-[100px] resize-y"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-gray-200 flex flex-wrap items-center justify-center gap-2.5 bg-gray-50 rounded-b-xl">
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
            Create Album
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}