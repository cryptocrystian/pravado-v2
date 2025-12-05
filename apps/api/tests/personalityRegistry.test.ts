/**
 * PersonalityRegistry tests (Sprint S11)
 */

import { describe, it, expect } from 'vitest';
import {
  SYSTEM_PERSONALITIES,
  getSystemPersonality,
  getAllSystemPersonalities,
} from '../src/services/personality/personalityRegistry';

describe('PersonalityRegistry', () => {
  describe('SYSTEM_PERSONALITIES', () => {
    it('should have 8 built-in personalities', () => {
      expect(SYSTEM_PERSONALITIES).toHaveLength(8);
    });

    it('should have all required personality fields', () => {
      SYSTEM_PERSONALITIES.forEach((personality) => {
        expect(personality).toHaveProperty('slug');
        expect(personality).toHaveProperty('name');
        expect(personality).toHaveProperty('description');
        expect(personality).toHaveProperty('configuration');

        const config = personality.configuration;
        expect(config).toHaveProperty('tone');
        expect(config).toHaveProperty('style');
        expect(config).toHaveProperty('riskTolerance');
        expect(config).toHaveProperty('domainSpecialty');
        expect(config).toHaveProperty('biasModifiers');
        expect(config).toHaveProperty('memoryWeight');
        expect(config).toHaveProperty('escalationSensitivity');
        expect(config).toHaveProperty('collaborationStyle');
        expect(config).toHaveProperty('constraints');
      });
    });

    it('should have unique slugs', () => {
      const slugs = SYSTEM_PERSONALITIES.map((p) => p.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    it('should have valid risk tolerance values', () => {
      const validRiskLevels = ['low', 'medium', 'high'];
      SYSTEM_PERSONALITIES.forEach((personality) => {
        expect(validRiskLevels).toContain(personality.configuration.riskTolerance);
      });
    });

    it('should have valid collaboration styles', () => {
      const validStyles = ['assertive', 'supportive', 'balanced'];
      SYSTEM_PERSONALITIES.forEach((personality) => {
        expect(validStyles).toContain(personality.configuration.collaborationStyle);
      });
    });

    it('should have valid memory weight and escalation sensitivity values', () => {
      SYSTEM_PERSONALITIES.forEach((personality) => {
        const { memoryWeight, escalationSensitivity } = personality.configuration;

        // Should be between 0 and 1
        expect(memoryWeight).toBeGreaterThanOrEqual(0);
        expect(memoryWeight).toBeLessThanOrEqual(1);
        expect(escalationSensitivity).toBeGreaterThanOrEqual(0);
        expect(escalationSensitivity).toBeLessThanOrEqual(1);
      });
    });

    it('should have domain specialties', () => {
      SYSTEM_PERSONALITIES.forEach((personality) => {
        expect(Array.isArray(personality.configuration.domainSpecialty)).toBe(true);
        expect(personality.configuration.domainSpecialty.length).toBeGreaterThan(0);
      });
    });

    it('should have bias modifiers', () => {
      SYSTEM_PERSONALITIES.forEach((personality) => {
        expect(typeof personality.configuration.biasModifiers).toBe('object');
      });
    });

    it('should have constraints', () => {
      SYSTEM_PERSONALITIES.forEach((personality) => {
        expect(typeof personality.configuration.constraints).toBe('object');
        expect(personality.configuration.constraints).toHaveProperty('require');
        expect(personality.configuration.constraints).toHaveProperty('forbid');
      });
    });
  });

  describe('getSystemPersonality', () => {
    it('should return PR Strategist personality by slug', () => {
      const personality = getSystemPersonality('pr-strategist');

      expect(personality).not.toBeNull();
      expect(personality?.slug).toBe('pr-strategist');
      expect(personality?.name).toBe('PR Strategist');
      expect(personality?.configuration.riskTolerance).toBe('medium');
      expect(personality?.configuration.collaborationStyle).toBe('assertive');
    });

    it('should return SEO Analyst personality by slug', () => {
      const personality = getSystemPersonality('seo-analyst');

      expect(personality).not.toBeNull();
      expect(personality?.slug).toBe('seo-analyst');
      expect(personality?.name).toBe('SEO Analyst');
      expect(personality?.configuration.riskTolerance).toBe('low');
      expect(personality?.configuration.collaborationStyle).toBe('supportive');
    });

    it('should return Content Architect personality by slug', () => {
      const personality = getSystemPersonality('content-architect');

      expect(personality).not.toBeNull();
      expect(personality?.slug).toBe('content-architect');
      expect(personality?.name).toBe('Content Architect');
      expect(personality?.configuration.riskTolerance).toBe('medium');
      expect(personality?.configuration.collaborationStyle).toBe('balanced');
    });

    it('should return Investigative Analyst personality by slug', () => {
      const personality = getSystemPersonality('investigative-analyst');

      expect(personality).not.toBeNull();
      expect(personality?.slug).toBe('investigative-analyst');
      expect(personality?.name).toBe('Investigative Analyst');
      expect(personality?.configuration.riskTolerance).toBe('low');
    });

    it('should return Generalist Agent personality by slug', () => {
      const personality = getSystemPersonality('generalist-agent');

      expect(personality).not.toBeNull();
      expect(personality?.slug).toBe('generalist-agent');
      expect(personality?.name).toBe('Generalist Agent');
      expect(personality?.configuration.riskTolerance).toBe('medium');
    });

    it('should return Social Media Manager personality by slug', () => {
      const personality = getSystemPersonality('social-media-manager');

      expect(personality).not.toBeNull();
      expect(personality?.slug).toBe('social-media-manager');
      expect(personality?.name).toBe('Social Media Manager');
      expect(personality?.configuration.riskTolerance).toBe('high');
    });

    it('should return Technical Writer personality by slug', () => {
      const personality = getSystemPersonality('technical-writer');

      expect(personality).not.toBeNull();
      expect(personality?.slug).toBe('technical-writer');
      expect(personality?.name).toBe('Technical Writer');
      expect(personality?.configuration.riskTolerance).toBe('low');
    });

    it('should return Brand Guardian personality by slug', () => {
      const personality = getSystemPersonality('brand-guardian');

      expect(personality).not.toBeNull();
      expect(personality?.slug).toBe('brand-guardian');
      expect(personality?.name).toBe('Brand Guardian');
      expect(personality?.configuration.riskTolerance).toBe('low');
    });

    it('should return null for non-existent slug', () => {
      const personality = getSystemPersonality('non-existent');
      expect(personality).toBeNull();
    });
  });

  describe('getAllSystemPersonalities', () => {
    it('should return all 8 system personalities', () => {
      const personalities = getAllSystemPersonalities();
      expect(personalities).toHaveLength(8);
    });

    it('should return a copy of the array', () => {
      const personalities1 = getAllSystemPersonalities();
      const personalities2 = getAllSystemPersonalities();

      // Should be equal but not the same reference
      expect(personalities1).toEqual(personalities2);
      expect(personalities1).not.toBe(personalities2);
    });

    it('should include all expected personalities', () => {
      const personalities = getAllSystemPersonalities();
      const slugs = personalities.map((p) => p.slug);

      expect(slugs).toContain('pr-strategist');
      expect(slugs).toContain('seo-analyst');
      expect(slugs).toContain('content-architect');
      expect(slugs).toContain('investigative-analyst');
      expect(slugs).toContain('generalist-agent');
      expect(slugs).toContain('social-media-manager');
      expect(slugs).toContain('technical-writer');
      expect(slugs).toContain('brand-guardian');
    });
  });

  describe('Personality Configuration Specifics', () => {
    it('PR Strategist should have correct configuration', () => {
      const personality = getSystemPersonality('pr-strategist');

      expect(personality?.configuration.tone).toBe('professional');
      expect(personality?.configuration.style).toBe('persuasive');
      expect(personality?.configuration.domainSpecialty).toContain('pr');
      expect(personality?.configuration.domainSpecialty).toContain('media');
      expect(personality?.configuration.biasModifiers.optimism).toBe(0.3);
      expect(personality?.configuration.memoryWeight).toBe(0.7);
      expect(personality?.configuration.escalationSensitivity).toBe(0.6);
      expect(personality?.configuration.constraints.require).toContain('journalist_validation');
      expect(personality?.configuration.constraints.forbid).toContain('spam_tactics');
    });

    it('SEO Analyst should have correct configuration', () => {
      const personality = getSystemPersonality('seo-analyst');

      expect(personality?.configuration.tone).toBe('analytical');
      expect(personality?.configuration.style).toBe('structured');
      expect(personality?.configuration.domainSpecialty).toContain('seo');
      expect(personality?.configuration.domainSpecialty).toContain('keywords');
      expect(personality?.configuration.biasModifiers.precision).toBe(0.5);
      expect(personality?.configuration.memoryWeight).toBe(0.8);
      expect(personality?.configuration.escalationSensitivity).toBe(0.4);
      expect(personality?.configuration.constraints.require).toContain('keyword_validation');
      expect(personality?.configuration.constraints.forbid).toContain('keyword_stuffing');
    });

    it('Content Architect should have correct configuration', () => {
      const personality = getSystemPersonality('content-architect');

      expect(personality?.configuration.tone).toBe('engaging');
      expect(personality?.configuration.style).toBe('narrative');
      expect(personality?.configuration.domainSpecialty).toContain('content');
      expect(personality?.configuration.domainSpecialty).toContain('writing');
      expect(personality?.configuration.biasModifiers.creativity).toBe(0.5);
      expect(personality?.configuration.memoryWeight).toBe(0.6);
      expect(personality?.configuration.escalationSensitivity).toBe(0.5);
      expect(personality?.configuration.constraints.require).toContain('originality_check');
      expect(personality?.configuration.constraints.forbid).toContain('plagiarism');
    });

    it('Social Media Manager should have high risk tolerance', () => {
      const personality = getSystemPersonality('social-media-manager');

      expect(personality?.configuration.riskTolerance).toBe('high');
      expect(personality?.configuration.tone).toBe('casual');
      expect(personality?.configuration.style).toBe('conversational');
      expect(personality?.configuration.escalationSensitivity).toBe(0.7);
    });

    it('Brand Guardian should have low risk tolerance', () => {
      const personality = getSystemPersonality('brand-guardian');

      expect(personality?.configuration.riskTolerance).toBe('low');
      expect(personality?.configuration.biasModifiers.conservatism).toBe(0.6);
      expect(personality?.configuration.biasModifiers.brand_consistency).toBe(0.8);
      expect(personality?.configuration.escalationSensitivity).toBe(0.2);
    });
  });
});
