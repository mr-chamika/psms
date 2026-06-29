'use client'
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { useRef } from 'react';
import PageHeader from '@/components/page-header';
import { AlertTriangle, Settings } from 'lucide-react';
import {
  ListDeleteAction,
  ListEditAction,
  ListTableActions,
} from '@/components/list-table-actions';
import {
  PAGE_CONTENT,
  LIST_PAGE_HEADER_ACTION,
  LIST_PAGE_FAILURE_ACTION,
  LIST_PAGE_HEADER_CANCEL,
  LIST_PAGE_SUCCESS_ACTION,
  LIST_FORM_ACTIONS,
  LIST_MODAL_CLOSE_BTN,
} from '@/lib/list-page-styles';

// Modal for adding/removing {type, amount} blocks (item types)
type ItemTypeBlock = { size: string; amount: number; quantity: number };
interface ItemTypesModalProps {
  show: boolean;
  setShow: (show: boolean) => void;
  value: ItemTypeBlock[];
  initialName?: string;
  initialDiscount?: number;
  editRowId?: number | null;
  onChange: (blocks: ItemTypeBlock[], name: string, discount: number) => void;
}
function ItemTypesModal({ show, setShow, value, onChange, initialName = '', initialDiscount = 0, editRowId }: ItemTypesModalProps) {
  const [blocks, setBlocks] = useState<ItemTypeBlock[]>(
    value.length ? value : [{ size: '', amount: 0, quantity: 1 }]
  );
  const [discount, setDiscount] = useState(initialDiscount);
  const [name, setName] = useState(initialName);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; idx: number | null }>({ show: false, idx: null });

  // Ref array for focusing inputs
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleBlockChange = (idx: number, field: keyof ItemTypeBlock, val: string | number) => {
    setBlocks((prevBlocks: ItemTypeBlock[]) => prevBlocks.map((b, i) => i === idx ? { ...b, [field]: val } : b));
  };
  const handleAddBlock = () => {
    setBlocks((prevBlocks: ItemTypeBlock[]) => {
      const newBlocks = [...prevBlocks, { size: '', amount: 0, quantity: 1 }];
      setTimeout(() => {
        inputRefs.current[newBlocks.length - 1]?.focus();
      }, 0);
      return newBlocks;
    });
  };
  const handleRemoveBlock = async (idx: number) => {
    const block = blocks[idx];
    if (block.size) {
      const res = await fetch(`/api/settings/check-usage?size=${encodeURIComponent(block.size)}`);
      const data = await res.json();
      if (data.inUse) {
        setErrorModal({ show: true, message: `Cannot delete "${block.size}" — it is used in ${data.count} existing order(s).` });
        return;
      }
    }
    setConfirmModal({ show: true, idx });
  };

  const confirmRemoveBlock = () => {
    if (confirmModal.idx !== null) {
      setBlocks(prev => prev.length > 1 ? prev.filter((_, i) => i !== confirmModal.idx) : prev);
    }
    setConfirmModal({ show: false, idx: null });
  };


  const handleSave = async () => {
    // detect size name changes by comparing original value prop vs current blocks
    const renames: { oldSize: string; newSize: string }[] = [];
    value.forEach((orig, i) => {
      if (blocks[i] && orig.size && blocks[i].size && orig.size !== blocks[i].size) {
        renames.push({ oldSize: orig.size, newSize: blocks[i].size });
      }
    });

    // update all DB records for each renamed size
    for (const { oldSize, newSize } of renames) {
      await fetch('/api/settings/update-size', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldSize, newSize }),
      });
    }

    onChange(blocks, name, discount);
    setShow(false);
  };

  return (
    <Modal show={show} setShow={setShow}>
      <div className="w-full max-w-xl mx-auto">
        <div className="isolate rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
          <div className="relative mb-6">
            <h2 className="pr-10 text-center text-xl font-semibold text-gray-900">
              {editRowId !== null && editRowId !== undefined ? 'Edit Item' : 'Add Item'}
            </h2>
            <button
              type="button"
              className={`${LIST_MODAL_CLOSE_BTN} absolute right-0 top-0`}
              aria-label="Close"
              onClick={() => setShow(false)}
            >
              X
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <Label className="mb-1 block text-xs font-medium text-gray-700">Item Type Name</Label>
              <Input
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                readOnly={editRowId != null}
                className={`rounded-lg border-gray-300 ${
                  editRowId != null
                    ? "cursor-default bg-gray-100 text-gray-700"
                    : "bg-gray-50"
                }`}
              />
            </div>

            {!editRowId && (
              <div>
                <Label className="mb-1 block text-xs font-medium text-gray-700">Discount Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Discount"
                  value={discount}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="rounded-lg border-gray-300 bg-gray-50"
                />
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-200">
              <div className="grid grid-cols-[minmax(0,1fr)_6.5rem_5rem_2.5rem] gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                <span>Size</span>
                <span>Amount</span>
                <span className="text-center">Qty</span>
                <span className="sr-only">Actions</span>
              </div>
              <div className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
                {blocks.map((block, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[minmax(0,1fr)_6.5rem_5rem_2.5rem] items-center gap-2 px-3 py-2"
                  >
                    <Input
                      placeholder="e.g. 3.5x4.5 cm"
                      value={block.size}
                      onChange={e => handleBlockChange(idx, 'size', e.target.value)}
                      ref={el => { inputRefs.current[idx] = el; }}
                      className="rounded-lg border-gray-300 bg-gray-50"
                    />
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={block.amount}
                      onChange={e => handleBlockChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                      className="rounded-lg border-gray-300 bg-gray-50"
                    />
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={block.quantity}
                      onChange={e => handleBlockChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                      className="rounded-lg border-gray-300 bg-gray-50 text-center"
                    />
                    <div className="flex items-center justify-center">
                      {blocks.length > 1 ? (
                        <ListDeleteAction
                          title="Remove size"
                          aria-label="Remove size"
                          onClick={() => handleRemoveBlock(idx)}
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddBlock}
              className={`${LIST_PAGE_SUCCESS_ACTION} mt-1 self-start appearance-none`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-base text-green-600">
                +
              </span>
              Add Block
            </button>
          </div>

          <div className={`${LIST_FORM_ACTIONS} mt-6`}>
            <button
              type="button"
              onClick={handleSave}
              className={`${LIST_PAGE_HEADER_ACTION} appearance-none`}
            >
              Save
            </button>
          </div>
        </div>
      </div>
      <Modal show={errorModal.show} setShow={v => setErrorModal(e => ({ ...e, show: v }))}>
        <div className="relative mx-auto w-full max-w-md max-h-[calc(100vh-2rem)] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex justify-end p-2">
            <button
              type="button"
              className={LIST_MODAL_CLOSE_BTN}
              onClick={() => setErrorModal(e => ({ ...e, show: false }))}
              aria-label="Close"
            >
              X
            </button>
          </div>

          <div className="px-6 pb-6">
            <div className="mb-4 flex items-center justify-center">
              <div className="rounded-full bg-amber-100 p-3">
                <AlertTriangle className="h-8 w-8 text-amber-600" strokeWidth={2} aria-hidden />
              </div>
            </div>

            <h2 className="mb-2 text-center text-xl font-semibold text-gray-900">Cannot Delete</h2>

            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p>{errorModal.message}</p>
            </div>

            <div className={LIST_FORM_ACTIONS}>
              <button
                type="button"
                onClick={() => setErrorModal(e => ({ ...e, show: false }))}
                className={`${LIST_PAGE_HEADER_ACTION} appearance-none`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal show={confirmModal.show} setShow={v => setConfirmModal(e => ({ ...e, show: v }))}>
        <div className="relative mx-auto w-full max-w-md max-h-[calc(100vh-2rem)] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex justify-end p-2">
            <button
              type="button"
              className={LIST_MODAL_CLOSE_BTN}
              onClick={() => setConfirmModal({ show: false, idx: null })}
              aria-label="Close"
            >
              X
            </button>
          </div>

          <div className="px-6 pb-6">
            <div className="mb-4 flex items-center justify-center">
              <div className="rounded-full bg-red-100 p-3">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M10 11V17" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 11V17" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 7H20" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 7H12H18V18C18 19.6569 16.6569 21 15 21H9C7.34315 21 6 19.6569 6 18V7Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <h2 className="mb-2 text-center text-xl font-semibold text-gray-900">Delete Size</h2>
            <p className="mb-6 text-center text-gray-600">
              Are you sure you want to delete this size? This cannot be undone.
            </p>

            <div className={LIST_FORM_ACTIONS}>
              <button
                type="button"
                onClick={() => setConfirmModal({ show: false, idx: null })}
                className={`${LIST_PAGE_HEADER_CANCEL} appearance-none`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveBlock}
                className={`${LIST_PAGE_FAILURE_ACTION} appearance-none`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </Modal>

    </Modal>
  );
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type ItemWithAmount = { size: string; amount: number };
/* HARDCODED DEFAULTS — data is now loaded from DB (seeded on first run)
const initialItemsByType: Record<string, ItemWithAmount[]> = {
  Sittings: [
    { size: '3.5x4.5 cm', amount: 230.0 },
    { size: '3x4 cm', amount: 200.0 },
    { size: '3.5x5 cm', amount: 250.0 },
    { size: '4 x 5 cm', amount: 260.0 },
    { size: 'Passport', amount: 300.0 },
    { size: 'NIC', amount: 210.0 },
    { size: 'Stamp (2.5x3Cm)', amount: 180.0 },
    { size: 'Green Card', amount: 320.0 },
    { size: '2x2.5 in (DL)', amount: 220.0 },
    { size: 'Postel ID', amount: 210.0 },
    { size: '2x2 in', amount: 200.0 },
    { size: 'Image (3.5x4.5)', amount: 230.0 },
    { size: 'Image (social media)', amount: 210.0 },
    { size: 'Image (4R 200dpi)', amount: 250.0 },
    { size: 'Image (4R 300dpi)', amount: 260.0 },
    { size: 'Image (Commercial)', amount: 350.0 },
    { size: 'Double Side (Canada.PR)', amount: 400.0 },
    { size: 'Rathne Gal Katayam', amount: 270.0 },
    { size: '4R', amount: 200.0 },
    { size: '4x8', amount: 210.0 },
    { size: '5x7', amount: 220.0 },
    { size: '6x6', amount: 230.0 },
    { size: '6x8', amount: 240.0 },
    { size: '6x9', amount: 250.0 },
    { size: '6x10', amount: 260.0 },
    { size: '6x12', amount: 270.0 },
    { size: '6x18', amount: 280.0 },
    { size: '6x20', amount: 290.0 },
    { size: '8x8', amount: 300.0 },
    { size: '8x10', amount: 310.0 },
    { size: '8x12', amount: 320.0 },
    { size: '8x13', amount: 330.0 },
    { size: '8x16', amount: 340.0 },
    { size: '8x20', amount: 350.0 },
    { size: '8x24', amount: 360.0 },
    { size: '10x10', amount: 370.0 },
    { size: '10x12', amount: 380.0 },
    { size: '10x12 (with Mount)', amount: 390.0 },
    { size: '10x15', amount: 400.0 },
    { size: '10x18', amount: 410.0 },
    { size: '10x20', amount: 420.0 },
    { size: '10x24', amount: 430.0 },
    { size: '12x12', amount: 440.0 },
    { size: '12x15', amount: 450.0 },
    { size: '12x16', amount: 460.0 },
    { size: '12x18', amount: 470.0 },
    { size: '12x20', amount: 480.0 },
    { size: '12x24', amount: 490.0 },
    { size: '16x20', amount: 500.0 },
    { size: '16x24', amount: 510.0 },
    { size: '20x24', amount: 520.0 },
    { size: '20x30', amount: 530.0 },
    { size: '24x36', amount: 540.0 },
  ],
  Media: [
    { size: '3.5x4.5 cm', amount: 200.0 },
    { size: '3x4 cm', amount: 180.0 },
    { size: '3.5x5 cm', amount: 210.0 },
    { size: '4 x 5 cm', amount: 220.0 },
    { size: 'Stamp (2.5x3Cm)', amount: 150.0 },
    { size: '2x2.5 in (DL)', amount: 160.0 },
    { size: 'Postel ID', amount: 170.0 },
    { size: '2x2 in', amount: 180.0 },
    { size: '4R', amount: 190.0 },
    { size: '4x8', amount: 200.0 },
    { size: '5x7', amount: 210.0 },
    { size: '6x6', amount: 220.0 },
    { size: '6x8', amount: 230.0 },
    { size: '6x9', amount: 240.0 },
    { size: '6x10', amount: 250.0 },
    { size: '6x12', amount: 260.0 },
    { size: '6x18', amount: 270.0 },
    { size: '6x20', amount: 280.0 },
    { size: '8x8', amount: 290.0 },
    { size: '8x10', amount: 300.0 },
    { size: '8x12', amount: 310.0 },
    { size: '8x13', amount: 320.0 },
    { size: '8x16', amount: 330.0 },
    { size: '8x20', amount: 340.0 },
    { size: '8x24', amount: 350.0 },
    { size: '10x10', amount: 360.0 },
    { size: '10x12', amount: 370.0 },
    { size: '10x12 (with Mount)', amount: 380.0 },
    { size: '10x15', amount: 390.0 },
    { size: '10x18', amount: 400.0 },
    { size: '10x20', amount: 410.0 },
    { size: '10x24', amount: 420.0 },
    { size: '12x12', amount: 430.0 },
    { size: '12x15', amount: 440.0 },
    { size: '12x16', amount: 450.0 },
    { size: '12x18', amount: 460.0 },
    { size: '12x20', amount: 470.0 },
    { size: '12x24', amount: 480.0 },
    { size: '16x20', amount: 490.0 },
    { size: '16x24', amount: 500.0 },
    { size: '20x24', amount: 510.0 },
    { size: '20x30', amount: 520.0 },
    { size: '24x36', amount: 530.0 },
  ],
  Frames: [
    { size: '3R', amount: 100.0 },
    { size: '4R', amount: 110.0 },
    { size: '4x8', amount: 120.0 },
    { size: '5x7', amount: 130.0 },
    { size: '6x6', amount: 140.0 },
    { size: '6x8', amount: 150.0 },
    { size: '6x9', amount: 160.0 },
    { size: '6x10', amount: 170.0 },
    { size: '6x12', amount: 180.0 },
    { size: '6x18', amount: 190.0 },
    { size: '6x20', amount: 200.0 },
    { size: '8x8', amount: 210.0 },
    { size: '8x10', amount: 220.0 },
    { size: '8x12', amount: 230.0 },
    { size: '8x13', amount: 240.0 },
    { size: '8x16', amount: 250.0 },
    { size: '8x20', amount: 260.0 },
    { size: '8x24', amount: 270.0 },
    { size: '10x10', amount: 280.0 },
    { size: '10x12', amount: 290.0 },
    { size: '10x15', amount: 300.0 },
    { size: '10x18', amount: 310.0 },
    { size: '10x20', amount: 320.0 },
    { size: '10x24', amount: 330.0 },
    { size: '12x12', amount: 340.0 },
    { size: '12x15', amount: 350.0 },
    { size: '12x16', amount: 360.0 },
    { size: '12x18', amount: 370.0 },
    { size: '12x20', amount: 380.0 },
    { size: '12x24', amount: 390.0 },
    { size: '16x20', amount: 400.0 },
    { size: '16x24', amount: 410.0 },
    { size: '20x20', amount: 420.0 },
    { size: '20x24', amount: 430.0 },
    { size: '20x30', amount: 440.0 },
    { size: '24x30', amount: 450.0 },
    { size: '24x36', amount: 460.0 },
  ],
  'Extra Copies': [
    { size: '3.5x4.5 cm', amount: 120.0 },
    { size: '3x4 cm', amount: 110.0 },
    { size: '3.5x5 cm', amount: 130.0 },
    { size: '4 x 5 cm', amount: 140.0 },
    { size: 'Recipt copy (NIC/Pass.P)', amount: 100.0 },
    { size: 'First time copy (NIC/Pass.P)', amount: 105.0 },
    { size: 'Stamp (2.5x3Cm)', amount: 115.0 },
    { size: 'Green Card', amount: 125.0 },
    { size: '2x2.5 in (DL)', amount: 135.0 },
    { size: 'Postel ID', amount: 145.0 },
    { size: '2x2 in', amount: 155.0 },
    { size: 'Image (First Time NIC/Pass.P)', amount: 165.0 },
    { size: 'Image (3.5x4.5)', amount: 175.0 },
    { size: 'Image (social media)', amount: 185.0 },
    { size: 'Image (4R 200dpi)', amount: 195.0 },
    { size: 'Image (4R 300dpi)', amount: 205.0 },
    { size: 'Image (Commercial)', amount: 215.0 },
    { size: 'Double Side (Canada.PR)', amount: 225.0 },
    { size: 'Rathne Gal Katayam', amount: 235.0 },
    { size: '4R', amount: 245.0 },
    { size: '4x8', amount: 255.0 },
    { size: '5x7', amount: 265.0 },
    { size: '6x6', amount: 275.0 },
    { size: '6x8', amount: 285.0 },
    { size: '6x9', amount: 295.0 },
    { size: '6x10', amount: 305.0 },
    { size: '6x12', amount: 315.0 },
    { size: '6x18', amount: 325.0 },
    { size: '6x20', amount: 335.0 },
    { size: '8x8', amount: 345.0 },
    { size: '8x10', amount: 355.0 },
    { size: '8x12', amount: 365.0 },
    { size: '8x13', amount: 375.0 },
    { size: '8x16', amount: 385.0 },
    { size: '8x20', amount: 395.0 },
    { size: '8x24', amount: 405.0 },
    { size: '10x10', amount: 415.0 },
    { size: '10x12', amount: 425.0 },
    { size: '10x12 (with Mount)', amount: 435.0 },
    { size: '10x15', amount: 445.0 },
    { size: '10x18', amount: 455.0 },
    { size: '10x20', amount: 465.0 },
    { size: '10x24', amount: 475.0 },
    { size: '12x12', amount: 485.0 },
    { size: '12x15', amount: 495.0 },
    { size: '12x16', amount: 505.0 },
    { size: '12x18', amount: 515.0 },
    { size: '12x20', amount: 525.0 },
    { size: '12x24', amount: 535.0 },
    { size: '16x20', amount: 545.0 },
    { size: '16x24', amount: 555.0 },
    { size: '20x24', amount: 565.0 },
    { size: '20x30', amount: 575.0 },
    { size: '24x36', amount: 585.0 },
  ],
};
// */
// const frameServiceTypes = [
//   'Fiber Fream',
//   'Ply-Mount',
//   'Service',
//   'Glass Change',
//   'Back Change',
//   'Stand & Hook',
// ];
/* const initialFrameTypeAmounts: Record<string, number> = {
  'Fiber Fream': 500,
  'Ply-Mount': 450,
  'Service': 300,
  'Glass Change': 350,
  'Back Change': 250,
  'Stand & Hook': 200,
// }; */
// const frameMaterials = [
//   'glass',
//   'fiber',
//   'wood',
//   'metal',
//   'plastic',
//   'aluminum',
//   'synthetic',
// ];
/* const initialFrameMaterialAmounts: Record<string, number> = {
  glass: 400,
  fiber: 350,
  wood: 300,
  metal: 450,
  plastic: 250,
  aluminum: 500,
  synthetic: 280,
};
const initialFSizeAmounts: Record<string, number> = {
  F1: 100,
  F2: 150,
  F3: 200,
  F4: 250,
  F5: 300,
  F6: 350,
  F7: 400,
}; */

type DiscountRow = {
  id: number;
  type: string;
  rate?: string; // for non-Frames
  itemDiscountRate?: string; // for Frames
  frameMaterialDiscountRate?: string; // for Frames
  fSizeDiscountRate?: string; // for Frames
  item?: ItemWithAmount | null;
  frameMaterial?: string;
  frameMaterialAmount?: number;
  fSize?: string;
  fSizeAmount?: number;
};


type StudioInfoForm = { studioName: string; email: string; phone: string; website: string; address: string };

function extractBillingAmounts(rows: DiscountRow[], fmAmounts: Record<string, number>, fsAmounts: Record<string, number>, items: Record<string, ItemWithAmount[]>) {
  return {
    // Only compare rates and row identity — not which item/type/material/size is selected
    rows: rows.map(r => r.type === 'Frames'
      ? {
        id: r.id,
        itemDiscountRate: r.itemDiscountRate,
        frameMaterialDiscountRate: r.frameMaterialDiscountRate,
        fSizeDiscountRate: r.fSizeDiscountRate,
      }
      : { id: r.id, rate: r.rate }
    ),
    frameMaterialAmounts: fmAmounts,
    fSizeAmounts: fsAmounts,
    itemsByType: items,
  };
}

export default function SystemSettings() {
  const [studioInfo, setStudioInfo] = useState<StudioInfoForm>({ studioName: '', email: '', phone: '', website: '', address: '' });
  const [studioLoading, setStudioLoading] = useState(true);
  const [studioSaving, setStudioSaving] = useState(false);
  const [savedStudioInfo, setSavedStudioInfo] = useState<StudioInfoForm>({ studioName: '', email: '', phone: '', website: '', address: '' });
  const studioInfoDirty = JSON.stringify(studioInfo) !== JSON.stringify(savedStudioInfo);

  useEffect(() => {
    fetch('/api/settings/studio')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          const loaded = { studioName: data.studioName ?? '', email: data.email ?? '', phone: data.phone ?? '', website: data.website ?? '', address: data.address ?? '' };
          setStudioInfo(loaded);
          setSavedStudioInfo(loaded);
        }
      })
      .finally(() => setStudioLoading(false));
  }, []);

  const handleStudioCancel = () => {
    setStudioInfo(savedStudioInfo);
  };

  const handleStudioSave = async () => {
    setStudioSaving(true);
    try {
      const res = await fetch('/api/settings/studio', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(studioInfo) });
      if (res.ok) {
        toast.success('Settings saved successfully!');
        const nameChanged = studioInfo.studioName !== savedStudioInfo.studioName;
        setSavedStudioInfo(studioInfo);
        window.dispatchEvent(new CustomEvent('studio-name-changed', { detail: studioInfo.studioName }));
        if (nameChanged) window.location.reload();
      }
      else toast.error('Failed to save settings.');
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setStudioSaving(false);
    }
  };

  // Inventory Items state
  type InventoryItem = { id: number; name: string; quantity: number; unitPrice: number };
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [savedInventoryItems, setSavedInventoryItems] = useState<InventoryItem[]>([]);
  const [inventorySaving, setInventorySaving] = useState(false);
  const inventoryDirty = JSON.stringify(inventoryItems) !== JSON.stringify(savedInventoryItems);

  const addInventoryItem = () => {
    setInventoryItems(prev => {
      const updated = [...prev, { id: prev.length ? Math.max(...prev.map(r => r.id)) + 1 : 1, name: '', quantity: 0, unitPrice: 0 }];
      // Save to backend after adding
      setTimeout(() => { handleInventorySave && handleInventorySave(); }, 0);
      return updated;
    });
  };
  const removeInventoryItem = (id: number) => setInventoryItems(prev => prev.filter(r => r.id !== id));
  const updateInventoryItem = (id: number, field: 'name' | 'quantity' | 'unitPrice', value: string | number) => {
    setInventoryItems(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleInventorySave = async () => {
    setInventorySaving(true);
    try {
      const payload = { discountRows, frameMaterialAmounts, fSizeAmounts, itemsByType, materialCosts, inventoryItems };
      const res = await fetch('/api/settings/billing', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { toast.success('Inventory items saved!'); setSavedInventoryItems(inventoryItems); }
      else toast.error('Failed to save inventory items.');
    } catch {
      toast.error('Failed to save inventory items.');
    } finally {
      setInventorySaving(false);
    }
  };

  // Material Cost state
  type MaterialCostRow = { id: number; name: string; amount: number };
  const [materialCosts, setMaterialCosts] = useState<MaterialCostRow[]>([]);
  const [savedMaterialCosts, setSavedMaterialCosts] = useState<MaterialCostRow[] | null>(null);
  const [materialCostSaving, setMaterialCostSaving] = useState(false);
  const materialCostDirty =
    savedMaterialCosts === null ||
    materialCosts.length !== (savedMaterialCosts?.length || 0) ||
    JSON.stringify(materialCosts) !== JSON.stringify(savedMaterialCosts);

  const addMaterialCostRow = () => {
    setMaterialCosts(prev => [...prev, { id: prev.length ? Math.max(...prev.map(r => r.id)) + 1 : 1, name: '', amount: 0 }]);
  };
  const removeMaterialCostRow = (id: number) => setMaterialCosts(prev => prev.filter(r => r.id !== id));
  const updateMaterialCostRow = (id: number, field: 'name' | 'amount', value: string | number) => {
    setMaterialCosts(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleMaterialCostSave = async () => {
    setMaterialCostSaving(true);
    try {
      const payload = { discountRows, frameMaterialAmounts, fSizeAmounts, itemsByType, materialCosts, inventoryItems };
      const res = await fetch('/api/settings/billing', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { toast.success('Material cost settings saved!'); setSavedMaterialCosts(materialCosts); }
      else toast.error('Failed to save material cost settings.');
    } catch {
      toast.error('Failed to save material cost settings.');
    } finally {
      setMaterialCostSaving(false);
    }
  };

  const [frameMaterialAmounts, setFrameMaterialAmounts] = useState<Record<string, number>>({});
  const [fSizeAmounts, setFSizeAmounts] = useState<Record<string, number>>({});

  // Derived from DB amount maps — no hardcoded option lists
  const frameMaterials = Object.keys(frameMaterialAmounts);
  const fSizes = Object.keys(fSizeAmounts);

  const [itemsByType, setItemsByType] = useState<Record<string, ItemWithAmount[]>>({});
  // ...existing code...
  const defaultRowIds = [1, 2, 3, 4];
  const [discountRows, setDiscountRows] = useState<DiscountRow[]>([]);
  // Ensure initial dropdown value's amount for frameType, frameMaterial, and fSize appears by auto-setting if not set
  useEffect(() => {
    const updatedRows = discountRows.map(row => {
      let changed = false;
      let newRow = { ...row };
      // frameMaterialAmount
      if (row.type === 'Frames' && (!row.frameMaterialAmount || row.frameMaterialAmount === 0) && frameMaterials.length && frameMaterialAmounts[frameMaterials[0]] !== undefined) {
        newRow.frameMaterial = newRow.frameMaterial || frameMaterials[0];
        newRow.frameMaterialAmount = frameMaterialAmounts[newRow.frameMaterial] ?? frameMaterialAmounts[frameMaterials[0]];
        changed = true;
      }
      // fSizeAmount
      if (row.type === 'Frames' && (!row.fSizeAmount || row.fSizeAmount === 0) && fSizes.length && fSizeAmounts[fSizes[0]] !== undefined) {
        newRow.fSize = newRow.fSize || fSizes[0];
        newRow.fSizeAmount = fSizeAmounts[newRow.fSize] ?? fSizeAmounts[fSizes[0]];
        changed = true;
      }
      return changed ? newRow : row;
    });
    // Only update if something actually changed
    if (JSON.stringify(updatedRows) !== JSON.stringify(discountRows)) {
      setDiscountRows(updatedRows);
    }
  }, [frameMaterials, frameMaterialAmounts, fSizes, fSizeAmounts, discountRows]);

  // Ensure initial dropdown value's amount appears by auto-setting row.item to the first available item if not set
  useEffect(() => {
    setDiscountRows(prevRows => prevRows.map(row => {
      if (row.type && !row.item && itemsByType[row.type]?.length) {
        return { ...row, item: itemsByType[row.type][0] };
      }
      return row;
    }));
  }, [itemsByType]);
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingSaving, setBillingSaving] = useState(false);
  const [savedBilling, setSavedBilling] = useState<object | null>(null);
  const billingDirty = savedBilling !== null && JSON.stringify(extractBillingAmounts(discountRows, frameMaterialAmounts, fSizeAmounts, itemsByType)) !== JSON.stringify(extractBillingAmounts((savedBilling as any).discountRows ?? [], (savedBilling as any).frameMaterialAmounts ?? {}, (savedBilling as any).fSizeAmounts ?? {}, (savedBilling as any).itemsByType ?? {}));

  useEffect(() => {
    fetch('/api/settings/billing')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error && data.discountRows?.length) {
          setDiscountRows(data.discountRows);
          if (data.frameMaterialAmounts) setFrameMaterialAmounts(data.frameMaterialAmounts);
          if (data.fSizeAmounts) setFSizeAmounts(data.fSizeAmounts);
          if (data.itemsByType) setItemsByType(data.itemsByType);
          setSavedBilling({ discountRows: data.discountRows, frameMaterialAmounts: data.frameMaterialAmounts ?? {}, fSizeAmounts: data.fSizeAmounts ?? {}, itemsByType: data.itemsByType ?? {} });
        } else {
          setSavedBilling({ discountRows: [], frameMaterialAmounts: {}, fSizeAmounts: {}, itemsByType: {} });
        }
        if (data && !data.error && Array.isArray(data.materialCosts)) {
          setMaterialCosts(data.materialCosts);
          setSavedMaterialCosts(data.materialCosts);
        } else {
          setSavedMaterialCosts([]);
        }
        if (data && !data.error && Array.isArray(data.inventoryItems)) {
          setInventoryItems(data.inventoryItems);
          setSavedInventoryItems(data.inventoryItems);
        } else {
          setInventoryItems([]);
          setSavedInventoryItems([]);
        }
      })
      .finally(() => setBillingLoading(false));
  }, []);

  const handleBillingSave = async () => {
    setBillingSaving(true);
    try {
      const payload = { discountRows, frameMaterialAmounts, fSizeAmounts, itemsByType, materialCosts, inventoryItems };
      const res = await fetch('/api/settings/billing', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { toast.success('Discount configurations saved!'); setSavedBilling(payload); }
      else toast.error('Failed to save discount settings.');
    } catch {
      toast.error('Failed to save discount settings.');
    } finally {
      setBillingSaving(false);
    }
  };

  const handleBillingCancel = () => {
    if (savedBilling === null) return;
    const saved = savedBilling as {
      discountRows?: DiscountRow[];
      frameMaterialAmounts?: Record<string, number>;
      fSizeAmounts?: Record<string, number>;
      itemsByType?: Record<string, ItemWithAmount[]>;
    };
    setDiscountRows(saved.discountRows ?? []);
    setFrameMaterialAmounts(saved.frameMaterialAmounts ?? {});
    setFSizeAmounts(saved.fSizeAmounts ?? {});
    setItemsByType(saved.itemsByType ?? {});
  };

  const openEditRowModal = (rowId: number) => {
    const selectedRow = discountRows.find(r => r.id === rowId);
    const blocks = selectedRow && selectedRow.type && itemsByType[selectedRow.type]
      ? itemsByType[selectedRow.type].map(item => ({ ...item, quantity: 1 }))
      : [{ size: '', amount: 0, quantity: 1 }];
    setItemTypes(blocks);
    setEditRowId(rowId);
    setItemTypesModalOpen(true);
  };

  const [itemTypesModalOpen, setItemTypesModalOpen] = useState(false);
  const [itemTypes, setItemTypes] = useState<ItemTypeBlock[]>([{
    size: '',
    amount: 0,
    quantity: 1
  }]);
  const [editRowId, setEditRowId] = useState<number | null>(null);

  const removeRow = (id: number) => {
    setDiscountRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: number, field: keyof DiscountRow, value: any) => {
    setDiscountRows(prev =>
      prev.map(r => {
        if (r.id !== id) return r;
        if (field === 'type') return { ...r, type: value };
        return { ...r, [field]: value };
      })
    );
  };

  return (
    <div className={PAGE_CONTENT}>
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-2xs">
        <PageHeader
          title="System Settings"
          icon={Settings}
          subtitle="Configure studio preferences, pricing, and system options."
        />
      </div>
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          {/* <TabsTrigger value="notifications">Notifications</TabsTrigger> */}
          <TabsTrigger value="billing">Billing</TabsTrigger>
          {/* <TabsTrigger value="material-cost">Inventory</TabsTrigger> */}
          {/* <TabsTrigger value="integrations">Integrations</TabsTrigger> */}
        </TabsList>

        <TabsContent value="general">
          <Card className="stat-card">
            <CardHeader>
              <CardTitle>Studio Information</CardTitle>
              <CardDescription>Basic information about your photography studio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="studioName">Studio Name</Label>
                  <Input suppressHydrationWarning id="studioName" value={studioInfo.studioName} disabled={studioLoading} onChange={e => setStudioInfo(p => ({ ...p, studioName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input suppressHydrationWarning id="email" type="email" value={studioInfo.email} disabled={studioLoading} onChange={e => setStudioInfo(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input suppressHydrationWarning id="phone" value={studioInfo.phone} disabled={studioLoading} onChange={e => setStudioInfo(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input suppressHydrationWarning id="website" value={studioInfo.website} disabled={studioLoading} onChange={e => setStudioInfo(p => ({ ...p, website: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input suppressHydrationWarning id="address" value={studioInfo.address} disabled={studioLoading} onChange={e => setStudioInfo(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className={LIST_FORM_ACTIONS}>
                <button
                  type="button"
                  onClick={handleStudioCancel}
                  disabled={studioLoading || !studioInfoDirty}
                  className={`${LIST_PAGE_HEADER_CANCEL} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStudioSave}
                  disabled={studioLoading || studioSaving || !studioInfoDirty}
                  className={`${LIST_PAGE_HEADER_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {studioSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>Add and manage inventory items for your studio</CardDescription>
              </div>
              <button type="button" onClick={addInventoryItem} className={`${LIST_PAGE_HEADER_ACTION} appearance-none`}>
                + Add Inventory Item
              </button>
            </CardHeader>
            {/* <CardContent>
              <table className="w-full">
                <thead className="sticky top-0 bg-white z-10">
                  <tr>
                    <th className="px-4 py-2 text-gray-500 font-semibold text-left">Item Name</th>
                    <th className="px-4 py-2 text-gray-500 font-semibold text-left w-32">Quantity</th>
                    <th className="px-4 py-2 text-gray-500 font-semibold text-left w-32">Unit Price (LKR)</th>
                    <th className="px-4 py-2 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50 bg-white">
                      <td className="py-3 border-t-2 border-gray-100 px-4 align-middle">
                        <input
                          type="text"
                          placeholder="e.g. Photo Paper"
                          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          value={row.name}
                          onChange={e => updateInventoryItem(row.id, 'name', e.target.value)}
                        />
                      </td>
                      <td className="py-3 border-t-2 border-gray-100 px-4 align-middle">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          value={row.quantity}
                          onChange={e => updateInventoryItem(row.id, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="py-3 border-t-2 border-gray-100 px-4 align-middle">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          value={row.unitPrice}
                          onChange={e => updateInventoryItem(row.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="py-3 border-t-2 border-gray-100 px-4 align-middle">
                        <div onClick={() => removeInventoryItem(row.id)} className="cursor-pointer flex justify-center">
                          <svg width="22px" height="22px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 11V17" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 11V17" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 7H20" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 7H12H18V18C18 19.6569 16.6569 21 15 21H9C7.34315 21 6 19.6569 6 18V7Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {inventoryItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-gray-500 py-8">
                        No inventory items configured. Click "+ Add Inventory Item" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={!inventorySaving && !billingLoading && inventoryDirty ? handleInventorySave : undefined}
                  disabled={inventorySaving || billingLoading || !inventoryDirty}
                  className={`${LIST_PAGE_HEADER_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {inventorySaving ? 'Saving...' : 'Update Inventory'}
                </button>
              </div>
            </CardContent> */}
          </Card>
        </TabsContent>

        {/* <TabsContent value="notifications">
          <Card className="stat-card">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive booking confirmations via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive session reminders via SMS</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when inventory is low</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Reminders</p>
                  <p className="text-sm text-muted-foreground">Send automatic payment reminders to clients</p>
                </div>
                <Switch />
              </div>
              <Button onClick={() => toast.success('Notification settings saved!')}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent> */}

        <TabsContent value="billing">
          <div className="space-y-6">
            {/* <Card className="stat-card">
              <CardHeader>
                <CardTitle>Billing Settings</CardTitle>
                <CardDescription>Configure payment and invoice settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" defaultValue="USD ($)" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input id="taxRate" type="number" defaultValue="8.5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
                    <Input id="paymentTerms" type="number" defaultValue="15" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                    <Input id="invoicePrefix" defaultValue="INV-2026-" />
                  </div>
                </div>
                <Button onClick={() => toast.success('Billing settings saved!')}>Save Settings</Button>
              </CardContent>
            </Card> */}
            <Card className="stat-card mb-5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Discount Ratio Configuration</CardTitle>
                  <CardDescription>Set discount rates per item type and item</CardDescription>
                </div>
                {/* <div onClick={() => { setItemTypes([{ size: '', amount: 0, quantity: 1 }]); setEditRowId(null); setItemTypesModalOpen(true); }} className="bg-[#1D3658] text-white h-9 px-5 pt-[4.5px] rounded-[10px] cursor-pointer flex items-center gap-1 text-sm">
                  + Add Item
                </div> */}
                <ItemTypesModal
                  key={`${editRowId}-${itemTypesModalOpen}`}
                  show={itemTypesModalOpen}
                  setShow={setItemTypesModalOpen}
                  value={itemTypes}
                  initialName={editRowId !== null ? (discountRows.find(r => r.id === editRowId)?.type || '') : ''}
                  initialDiscount={editRowId !== null ? parseFloat(discountRows.find(r => r.id === editRowId)?.rate || '0') : 0}
                  editRowId={editRowId}
                  onChange={(blocks: ItemTypeBlock[], name: string, discount: number) => {
                    name = name.trim();
                    if (!name) return;
                    if (editRowId !== null) {
                      // Edit existing row
                      setDiscountRows(prev => prev.map(r => {
                        if (r.id !== editRowId) return r;
                        if (name === 'Frames') {
                          return {
                            ...r,
                            type: name,
                            item: blocks.length ? { size: blocks[0].size, amount: blocks[0].amount } : null,
                            quantity: blocks.length ? String(blocks[0].quantity) : '1',
                            itemDiscountRate: r.itemDiscountRate ?? '',
                            frameMaterialDiscountRate: r.frameMaterialDiscountRate ?? '',
                            fSizeDiscountRate: r.fSizeDiscountRate ?? '',
                            rate: undefined,
                          };
                        } else {
                          return {
                            ...r,
                            type: name,
                            item: blocks.length ? { size: blocks[0].size, amount: blocks[0].amount } : null,
                            quantity: blocks.length ? String(blocks[0].quantity) : '1',
                            rate: String(discount ?? 0),
                            itemDiscountRate: undefined,
                            frameMaterialDiscountRate: undefined,
                            fSizeDiscountRate: undefined,
                          };
                        }
                      }));
                      setItemsByType(prev => ({ ...prev, [name]: blocks.map(({ size, amount }) => ({ size, amount })) }));
                    } else {
                      // Add new row
                      setItemsByType(prev => ({ ...prev, [name]: blocks.map(({ size, amount }) => ({ size, amount })) }));
                      setDiscountRows(prev => {
                        const updated = [
                          ...prev,
                          name === 'Frames'
                            ? {
                              id: prev.length ? Math.max(...prev.map(r => r.id)) + 1 : 1,
                              type: name,
                              item: blocks.length ? { size: blocks[0].size, amount: blocks[0].amount } : null,
                              quantity: blocks.length ? String(blocks[0].quantity) : '1',
                              itemDiscountRate: '',
                              frameMaterialDiscountRate: '',
                              fSizeDiscountRate: '',
                              rate: undefined,
                            }
                            : {
                              id: prev.length ? Math.max(...prev.map(r => r.id)) + 1 : 1,
                              type: name,
                              item: blocks.length ? { size: blocks[0].size, amount: blocks[0].amount } : null,
                              quantity: blocks.length ? String(blocks[0].quantity) : '1',
                              rate: String(discount ?? 0),
                            }
                        ];
                        return updated;
                      });
                    }
                    setItemTypes(blocks);
                    setEditRowId(null);
                    // Save to backend after adding or editing
                    setTimeout(() => { handleBillingSave && handleBillingSave(); }, 0);
                  }}
                />
              </CardHeader>
              <CardContent>
                <table className="w-full table-fixed">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr>
                      <th className="px-4 py-2 text-gray-500 font-semibold text-left w-1/5">Item Type</th>
                      <th className="px-4 py-2 text-gray-500 font-semibold text-left w-1/4">Item</th>
                      <th className="px-4 py-2 text-gray-500 font-semibold text-left w-1/4">Amount (LKR)</th>
                      <th className="px-4 py-2 text-gray-500 font-semibold text-left ">Discount Rate (%)</th>
                      <th className="px-4 py-2 w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {discountRows.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50 bg-white">
                        <td className="font-normal py-3 border-t-2 border-gray-100 px-4 align-middle">
                          {row.type}
                        </td>
                        <td className="py-3 border-t-2 border-gray-100 px-4 align-middle">
                          {row.type === 'Frames' ? (
                            <div className="flex flex-col gap-2">
                              <Select value={row.item?.size ?? ''} onValueChange={v => { const found = (itemsByType['Frames'] || []).find(i => i.size === v) || null; updateRow(row.id, 'item', found); }}>
                                <SelectTrigger><SelectValue>{row.item?.size ?? (itemsByType['Frames']?.[0]?.size || '')}</SelectValue></SelectTrigger>
                                <SelectContent>{(itemsByType['Frames'] || []).map(i => <SelectItem key={i.size} value={i.size}>{i.size}</SelectItem>)}</SelectContent>
                              </Select>
                              <Select value={row.frameMaterial || frameMaterials[0] || ''} onValueChange={v => { updateRow(row.id, 'frameMaterial', v); updateRow(row.id, 'frameMaterialAmount', frameMaterialAmounts[v] ?? 0); }}>
                                <SelectTrigger><SelectValue>{row.frameMaterial || frameMaterials[0] || ''}</SelectValue></SelectTrigger>
                                <SelectContent>{frameMaterials.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                              </Select>
                              <Select value={row.fSize || fSizes[0] || ''} onValueChange={v => { updateRow(row.id, 'fSize', v); updateRow(row.id, 'fSizeAmount', fSizeAmounts[v] ?? 0); }}>
                                <SelectTrigger><SelectValue>{row.fSize || fSizes[0] || ''}</SelectValue></SelectTrigger>
                                <SelectContent>{fSizes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <Select value={row.item?.size ?? (itemsByType[row.type]?.[0]?.size || '')} onValueChange={v => { const found = (itemsByType[row.type] || []).find(i => i.size === v) || null; updateRow(row.id, 'item', found); }} disabled={!row.type}>
                              <SelectTrigger><SelectValue>{row.item?.size ?? (itemsByType[row.type]?.[0]?.size || '')}</SelectValue></SelectTrigger>
                              <SelectContent>{(itemsByType[row.type] || []).map(i => <SelectItem key={i.size} value={i.size}>{i.size}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="py-3 border-t-2 border-gray-100 px-4 align-middle">
                          {row.type === 'Frames' ? (
                            <div className="flex flex-col gap-2">
                              <input type="number" min="0" placeholder="Amount" className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed" value={row.item?.amount ?? ''} disabled={!row.item} onChange={e => { const amount = parseFloat(e.target.value) || 0; if (row.item) { updateRow(row.id, 'item', { ...row.item, amount }); setItemsByType(p => { const arr = [...(p[row.type] || [])]; const idx = arr.findIndex(i => i.size === row.item?.size); if (idx !== -1) arr[idx] = { ...arr[idx], amount }; return { ...p, [row.type]: arr }; }); } }} />
                              <input type="number" min="0" placeholder="Amount" className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed" value={row.frameMaterialAmount ?? ''} disabled={!row.frameMaterial} onChange={e => { const amount = parseFloat(e.target.value) || 0; updateRow(row.id, 'frameMaterialAmount', amount); if (row.frameMaterial) setFrameMaterialAmounts(p => ({ ...p, [row.frameMaterial!]: amount })); updateRow(row.id, 'frameMaterialAmount', amount); }} />
                              <input type="number" min="0" placeholder="Amount" className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed" value={row.fSizeAmount ?? ''} disabled={!row.fSize} onChange={e => { const amount = parseFloat(e.target.value) || 0; updateRow(row.id, 'fSizeAmount', amount); if (row.fSize) setFSizeAmounts(p => ({ ...p, [row.fSize!]: amount })); updateRow(row.id, 'fSizeAmount', amount); }} />
                            </div>
                          ) : (
                            <input type="number" min="0" className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed" value={row.item?.amount ?? ''} disabled={!row.item} onChange={e => { const amount = parseFloat(e.target.value) || 0; if (row.item) { updateRow(row.id, 'item', { ...row.item, amount }); setItemsByType(p => { const arr = [...(p[row.type] || [])]; const idx = arr.findIndex(i => i.size === row.item?.size); if (idx !== -1) arr[idx] = { ...arr[idx], amount }; return { ...p, [row.type]: arr }; }); } }} />
                          )}
                        </td>
                        <td className="py-3 border-t-2 border-gray-100 px-4 align-middle">
                          {row.type === 'Frames' ? (
                            <div className="flex flex-col gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Item Discount"
                                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                value={row.itemDiscountRate ?? ''}
                                onChange={e => updateRow(row.id, 'itemDiscountRate', e.target.value)}
                              />
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Material Discount"
                                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                value={row.frameMaterialDiscountRate ?? ''}
                                onChange={e => updateRow(row.id, 'frameMaterialDiscountRate', e.target.value)}
                              />
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Size Discount"
                                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                value={row.fSizeDiscountRate ?? ''}
                                onChange={e => updateRow(row.id, 'fSizeDiscountRate', e.target.value)}
                              />
                            </div>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                              value={row.rate ?? ''}
                              onChange={e => updateRow(row.id, 'rate', e.target.value)}
                            />
                          )}
                        </td>
                        <td className="py-3 border-t-2 border-gray-100 px-4 align-middle">
                          <ListTableActions>
                            {!defaultRowIds.includes(row.id) && (
                              <ListDeleteAction
                                title="Delete discount row"
                                aria-label="Delete discount row"
                                onClick={() => removeRow(row.id)}
                              />
                            )}
                            <ListEditAction
                              title="Edit discount row"
                              aria-label="Edit discount row"
                              onClick={() => openEditRowModal(row.id)}
                            />
                          </ListTableActions>
                        </td>
                      </tr>
                    ))}
                    {discountRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-gray-500 py-8">
                          No discount configurations.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className={LIST_FORM_ACTIONS}>
                  <button
                    type="button"
                    onClick={handleBillingCancel}
                    disabled={billingLoading || !billingDirty}
                    className={`${LIST_PAGE_HEADER_CANCEL} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBillingSave}
                    disabled={billingSaving || billingLoading || !billingDirty}
                    className={`${LIST_PAGE_HEADER_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {billingSaving ? 'Saving...' : 'Save Discount Settings'}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* <TabsContent value="material-cost">
          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Material Cost Configuration</CardTitle>
                <CardDescription>Define material costs (e.g. paper, ink) included in total price calculation</CardDescription>
              </div>
              <div onClick={addMaterialCostRow} className="bg-[#1D3658] text-white h-9 px-5 pt-[4.5px] rounded-[10px] cursor-pointer flex items-center gap-1 text-sm">
                + Add Item
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead className="sticky top-0 bg-white z-10">
                  <tr>
                    <th className="px-4 py-2 text-gray-500 font-semibold text-left">Cost Name</th>
                    <th className="px-4 py-2 text-gray-500 font-semibold text-left w-48">Amount (LKR)</th>
                    <th className="px-4 py-2 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {materialCosts.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50 bg-white">
                      <td className="py-3 border-t-2 border-gray-100 px-4 align-middle">
                        <input
                          type="text"
                          placeholder="e.g. Paper Cost"
                          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          value={row.name}
                          onChange={e => updateMaterialCostRow(row.id, 'name', e.target.value)}
                        />
                      </td>
                      <td className="py-3 border-t-2 border-gray-100 px-4 align-middle">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          value={row.amount}
                          onChange={e => updateMaterialCostRow(row.id, 'amount', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="py-3 border-t-2 border-gray-100 px-4 align-middle">
                        <div onClick={() => removeMaterialCostRow(row.id)} className="cursor-pointer flex justify-center">
                          <svg width="22px" height="22px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 11V17" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 11V17" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 7H20" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 7H12H18V18C18 19.6569 16.6569 21 15 21H9C7.34315 21 6 19.6569 6 18V7Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {materialCosts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-gray-500 py-8">
                        No material costs configured. Click &quot;Add Sub-field&quot; to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {materialCosts.length > 0 && (
                <div className="mt-2 px-4 py-2 bg-gray-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total Material Cost</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {materialCosts.reduce((sum, r) => sum + (r.amount || 0), 0).toFixed(2)} LKR
                  </span>
                </div>
              )}
              <div className="mt-4">
                <div
                  onClick={!materialCostSaving && !billingLoading && materialCostDirty ? handleMaterialCostSave : undefined}
                  className={`bg-[#1D3658] text-white h-9 px-5 pt-[4.5px] rounded-[10px] inline-flex items-center text-sm ${materialCostSaving || billingLoading || !materialCostDirty ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {materialCostSaving ? 'Saving...' : 'Update Inventory'}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* <TabsContent value="integrations">
          <Card className="stat-card">
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Connect third-party services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded bg-blue-500/10 flex items-center justify-center text-xl">📧</div>
                  <div>
                    <p className="font-medium">Email Service</p>
                    <p className="text-sm text-muted-foreground">SendGrid Integration</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => toast.info('Configure email integration')}>Configure</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded bg-green-500/10 flex items-center justify-center text-xl">💳</div>
                  <div>
                    <p className="font-medium">Payment Gateway</p>
                    <p className="text-sm text-muted-foreground">Stripe Connected</p>
                  </div>
                </div>
                <StatusBadge className="bg-success/10 text-success">Connected</StatusBadge>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded bg-purple-500/10 flex items-center justify-center text-xl">📅</div>
                  <div>
                    <p className="font-medium">Calendar Sync</p>
                    <p className="text-sm text-muted-foreground">Google Calendar</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => toast.info('Connect calendar')}>Connect</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  );
}

function StatusBadge({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`} {...props}>
      {children}
    </span>
  );
}