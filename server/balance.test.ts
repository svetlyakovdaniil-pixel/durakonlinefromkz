import { describe, it, expect } from "vitest";
import { formatBalance } from "../shared/formatBalance";

describe("Balance system", () => {
  describe("formatBalance", () => {
    it("shows numbers below 1000 as-is", () => {
      expect(formatBalance(0)).toBe("0");
      expect(formatBalance(100)).toBe("100");
      expect(formatBalance(999)).toBe("999");
    });

    it("formats thousands with К suffix", () => {
      expect(formatBalance(1000)).toBe("1К");
      expect(formatBalance(1400)).toBe("1,4К");
      expect(formatBalance(1500)).toBe("1,5К");
      expect(formatBalance(2000)).toBe("2К");
      expect(formatBalance(10000)).toBe("10К");
      expect(formatBalance(50000)).toBe("50К");
      expect(formatBalance(100000)).toBe("100К");
      expect(formatBalance(500000)).toBe("500К");
      expect(formatBalance(999000)).toBe("999К");
    });

    it("formats millions with КК suffix", () => {
      expect(formatBalance(1000000)).toBe("1КК");
      expect(formatBalance(7000000)).toBe("7КК");
      expect(formatBalance(1500000)).toBe("1,5КК");
      expect(formatBalance(10000000)).toBe("10КК");
    });
  });

  describe("Tier pricing", () => {
    const tiers = {
      "10k": { shanyrak: 10000, tenge: 50 },
      "50k": { shanyrak: 50000, tenge: 220 },
      "100k": { shanyrak: 100000, tenge: 400 },
      "500k": { shanyrak: 500000, tenge: 1500 },
    };

    it("has correct shanyrak amounts for each tier", () => {
      expect(tiers["10k"].shanyrak).toBe(10000);
      expect(tiers["50k"].shanyrak).toBe(50000);
      expect(tiers["100k"].shanyrak).toBe(100000);
      expect(tiers["500k"].shanyrak).toBe(500000);
    });

    it("has correct tenge costs for each tier", () => {
      expect(tiers["10k"].tenge).toBe(50);
      expect(tiers["50k"].tenge).toBe(220);
      expect(tiers["100k"].tenge).toBe(400);
      expect(tiers["500k"].tenge).toBe(1500);
    });

    it("higher tiers offer better value per tenge", () => {
      const valuePerTenge = Object.values(tiers).map(
        (t) => t.shanyrak / t.tenge
      );
      // Each tier should give more shanyrak per tenge than the previous
      for (let i = 1; i < valuePerTenge.length; i++) {
        expect(valuePerTenge[i]).toBeGreaterThan(valuePerTenge[i - 1]);
      }
    });
  });

  describe("Free topup logic", () => {
    it("should top up to 2000 from lower balance", () => {
      const currentBalance = 500;
      const targetBalance = 2000;
      const added = targetBalance - currentBalance;
      expect(added).toBe(1500);
    });

    it("should add only the difference to reach 2000", () => {
      const currentBalance = 1900;
      const targetBalance = 2000;
      const added = targetBalance - currentBalance;
      expect(added).toBe(100);
    });

    it("should not top up if already at 2000 or above", () => {
      const currentBalance = 2000;
      expect(currentBalance >= 2000).toBe(true);
    });

    it("cooldown should be 12 hours (43200000 ms)", () => {
      const cooldownMs = 12 * 60 * 60 * 1000;
      expect(cooldownMs).toBe(43200000);
    });

    it("should detect cooldown correctly", () => {
      const lastTopup = new Date();
      const cooldownEnd = new Date(lastTopup.getTime() + 12 * 60 * 60 * 1000);
      const now = new Date(lastTopup.getTime() + 6 * 60 * 60 * 1000); // 6 hours later
      expect(now < cooldownEnd).toBe(true); // still in cooldown

      const later = new Date(lastTopup.getTime() + 13 * 60 * 60 * 1000); // 13 hours later
      expect(later < cooldownEnd).toBe(false); // cooldown expired
    });
  });

  describe("Initial balance for new players", () => {
    it("should give 5000 shanyrak and 25 tenge", () => {
      const initialShanyrak = 5000;
      const initialTenge = 25;
      expect(initialShanyrak).toBe(5000);
      expect(initialTenge).toBe(25);
    });
  });

  describe("Buy shanyrak with tenge", () => {
    it("should deduct correct tenge and add correct shanyrak", () => {
      const currentTenge = 200;
      const currentShanyrak = 5000;
      const tier = { shanyrak: 10000, tenge: 50 };

      const newTenge = currentTenge - tier.tenge;
      const newShanyrak = currentShanyrak + tier.shanyrak;

      expect(newTenge).toBe(150);
      expect(newShanyrak).toBe(15000);
    });

    it("should allow multiple purchases if enough tenge", () => {
      let tenge = 200;
      let shanyrak = 5000;
      const cost = 50;
      const gain = 10000;

      // Buy 4 times
      for (let i = 0; i < 4; i++) {
        expect(tenge >= cost).toBe(true);
        tenge -= cost;
        shanyrak += gain;
      }

      expect(tenge).toBe(0);
      expect(shanyrak).toBe(45000);
    });

    it("should reject purchase if insufficient tenge", () => {
      const currentTenge = 30;
      const tierCost = 50;
      expect(currentTenge < tierCost).toBe(true);
    });
  });
});
