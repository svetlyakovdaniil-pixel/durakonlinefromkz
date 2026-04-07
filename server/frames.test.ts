import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./db', () => ({
  getOwnedFrames: vi.fn(),
  purchaseFrame: vi.fn(),
  equipFrame: vi.fn(),
  getEquippedFrame: vi.fn(),
}));

import { getOwnedFrames, purchaseFrame, equipFrame, getEquippedFrame } from './db';

const mockedGetOwnedFrames = vi.mocked(getOwnedFrames);
const mockedPurchaseFrame = vi.mocked(purchaseFrame);
const mockedEquipFrame = vi.mocked(equipFrame);
const mockedGetEquippedFrame = vi.mocked(getEquippedFrame);

describe('Avatar Frames', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOwnedFrames', () => {
    it('should return empty array when no frames owned', async () => {
      mockedGetOwnedFrames.mockResolvedValue([]);
      const result = await getOwnedFrames(1);
      expect(result).toEqual([]);
    });

    it('should return owned frame IDs', async () => {
      mockedGetOwnedFrames.mockResolvedValue(['fire']);
      const result = await getOwnedFrames(1);
      expect(result).toEqual(['fire']);
      expect(result).toContain('fire');
    });
  });

  describe('purchaseFrame', () => {
    it('should successfully purchase a frame', async () => {
      mockedPurchaseFrame.mockResolvedValue({ success: true, newTenge: 500 });
      const result = await purchaseFrame(1, 'fire', 500);
      expect(result.success).toBe(true);
      expect(result.newTenge).toBe(500);
    });

    it('should fail when already owned', async () => {
      mockedPurchaseFrame.mockResolvedValue({ success: false, reason: 'already_owned' });
      const result = await purchaseFrame(1, 'fire', 500);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('already_owned');
    });

    it('should fail with insufficient tenge', async () => {
      mockedPurchaseFrame.mockResolvedValue({ success: false, reason: 'insufficient_tenge' });
      const result = await purchaseFrame(1, 'fire', 500);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('insufficient_tenge');
    });

    it('should fail when profile not found', async () => {
      mockedPurchaseFrame.mockResolvedValue({ success: false, reason: 'not_found' });
      const result = await purchaseFrame(999, 'fire', 500);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('not_found');
    });

    it('should fail when db unavailable', async () => {
      mockedPurchaseFrame.mockResolvedValue({ success: false, reason: 'db_unavailable' });
      const result = await purchaseFrame(1, 'fire', 500);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('db_unavailable');
    });
  });

  describe('equipFrame', () => {
    it('should successfully equip a frame', async () => {
      mockedEquipFrame.mockResolvedValue({ success: true });
      const result = await equipFrame(1, 'fire');
      expect(result.success).toBe(true);
    });

    it('should successfully unequip a frame (null)', async () => {
      mockedEquipFrame.mockResolvedValue({ success: true });
      const result = await equipFrame(1, null);
      expect(result.success).toBe(true);
    });

    it('should fail when frame not owned', async () => {
      mockedEquipFrame.mockResolvedValue({ success: false, reason: 'not_owned' });
      const result = await equipFrame(1, 'fire');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('not_owned');
    });

    it('should fail when profile not found', async () => {
      mockedEquipFrame.mockResolvedValue({ success: false, reason: 'not_found' });
      const result = await equipFrame(999, 'fire');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('not_found');
    });
  });

  describe('getEquippedFrame', () => {
    it('should return null when no frame equipped', async () => {
      mockedGetEquippedFrame.mockResolvedValue(null);
      const result = await getEquippedFrame(1);
      expect(result).toBeNull();
    });

    it('should return equipped frame ID', async () => {
      mockedGetEquippedFrame.mockResolvedValue('fire');
      const result = await getEquippedFrame(1);
      expect(result).toBe('fire');
    });
  });

  describe('Frame purchase flow', () => {
    it('should handle full purchase + equip flow', async () => {
      // Step 1: No frames initially
      mockedGetOwnedFrames.mockResolvedValue([]);
      let owned = await getOwnedFrames(1);
      expect(owned).toEqual([]);

      // Step 2: Purchase fire frame
      mockedPurchaseFrame.mockResolvedValue({ success: true, newTenge: 500 });
      const purchaseResult = await purchaseFrame(1, 'fire', 500);
      expect(purchaseResult.success).toBe(true);

      // Step 3: Now owns fire frame
      mockedGetOwnedFrames.mockResolvedValue(['fire']);
      owned = await getOwnedFrames(1);
      expect(owned).toContain('fire');

      // Step 4: Equip fire frame
      mockedEquipFrame.mockResolvedValue({ success: true });
      const equipResult = await equipFrame(1, 'fire');
      expect(equipResult.success).toBe(true);

      // Step 5: Verify equipped
      mockedGetEquippedFrame.mockResolvedValue('fire');
      const equipped = await getEquippedFrame(1);
      expect(equipped).toBe('fire');

      // Step 6: Unequip
      mockedEquipFrame.mockResolvedValue({ success: true });
      const unequipResult = await equipFrame(1, null);
      expect(unequipResult.success).toBe(true);

      // Step 7: Verify unequipped
      mockedGetEquippedFrame.mockResolvedValue(null);
      const unequipped = await getEquippedFrame(1);
      expect(unequipped).toBeNull();
    });

    it('should not allow purchasing same frame twice', async () => {
      mockedPurchaseFrame.mockResolvedValueOnce({ success: true, newTenge: 500 });
      const first = await purchaseFrame(1, 'fire', 500);
      expect(first.success).toBe(true);

      mockedPurchaseFrame.mockResolvedValueOnce({ success: false, reason: 'already_owned' });
      const second = await purchaseFrame(1, 'fire', 500);
      expect(second.success).toBe(false);
      expect(second.reason).toBe('already_owned');
    });
  });

  describe('New frame types (neon, lightning, ice)', () => {
    it('should support purchasing neon frame', async () => {
      mockedPurchaseFrame.mockResolvedValue({ success: true, newTenge: 200 });
      const result = await purchaseFrame(1, 'neon', 800);
      expect(result.success).toBe(true);
    });

    it('should support purchasing lightning frame', async () => {
      mockedPurchaseFrame.mockResolvedValue({ success: true, newTenge: 100 });
      const result = await purchaseFrame(1, 'lightning', 1200);
      expect(result.success).toBe(true);
    });

    it('should support purchasing ice frame', async () => {
      mockedPurchaseFrame.mockResolvedValue({ success: true, newTenge: 0 });
      const result = await purchaseFrame(1, 'ice', 1000);
      expect(result.success).toBe(true);
    });

    it('should support equipping neon frame', async () => {
      mockedEquipFrame.mockResolvedValue({ success: true });
      const result = await equipFrame(1, 'neon');
      expect(result.success).toBe(true);
    });

    it('should support equipping lightning frame', async () => {
      mockedEquipFrame.mockResolvedValue({ success: true });
      const result = await equipFrame(1, 'lightning');
      expect(result.success).toBe(true);
    });

    it('should support equipping ice frame', async () => {
      mockedEquipFrame.mockResolvedValue({ success: true });
      const result = await equipFrame(1, 'ice');
      expect(result.success).toBe(true);
    });

    it('should return all owned frames including new types', async () => {
      mockedGetOwnedFrames.mockResolvedValue(['fire', 'neon', 'lightning', 'ice']);
      const result = await getOwnedFrames(1);
      expect(result).toEqual(['fire', 'neon', 'lightning', 'ice']);
      expect(result).toHaveLength(4);
    });

    it('should handle full flow with new frame types', async () => {
      // Purchase neon
      mockedPurchaseFrame.mockResolvedValueOnce({ success: true, newTenge: 200 });
      const purchase = await purchaseFrame(1, 'neon', 800);
      expect(purchase.success).toBe(true);

      // Equip neon
      mockedEquipFrame.mockResolvedValueOnce({ success: true });
      const equip = await equipFrame(1, 'neon');
      expect(equip.success).toBe(true);

      // Verify equipped
      mockedGetEquippedFrame.mockResolvedValueOnce('neon');
      const equipped = await getEquippedFrame(1);
      expect(equipped).toBe('neon');

      // Switch to ice
      mockedEquipFrame.mockResolvedValueOnce({ success: true });
      const switchResult = await equipFrame(1, 'ice');
      expect(switchResult.success).toBe(true);

      mockedGetEquippedFrame.mockResolvedValueOnce('ice');
      const newEquipped = await getEquippedFrame(1);
      expect(newEquipped).toBe('ice');
    });
  });
});
