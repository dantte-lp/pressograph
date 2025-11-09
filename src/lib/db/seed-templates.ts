import { db } from './index';
import { testTemplates, users, organizations } from './schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

/**
 * Seed system templates for pressure tests
 *
 * This script creates standard templates that are pre-configured
 * with commonly used test parameters.
 *
 * Run with: pnpm tsx src/lib/db/seed-templates.ts
 */
async function seedTemplates() {
  console.log('🌱 Starting system templates seeding...');

  try {
    // Find the first organization and user (system templates)
    const [organization] = await db
      .select()
      .from(organizations)
      .limit(1);

    if (!organization) {
      console.error('❌ No organization found. Please run seed.ts first.');
      process.exit(1);
    }

    const [systemUser] = await db
      .select()
      .from(users)
      .where(eq(users.organizationId, organization.id))
      .limit(1);

    if (!systemUser) {
      console.error('❌ No user found. Please run seed.ts first.');
      process.exit(1);
    }

    console.log(`✅ Found organization: ${organization.name}`);
    console.log(`✅ Found user: ${systemUser.name}`);

    // System templates data
    const templates = [
      {
        name: 'Daily Pressure Test',
        description: 'Standard 24-hour pressure test for daily pipeline verification',
        category: 'daily',
        config: {
          workingPressure: 10,
          maxPressure: 15,
          testDuration: 24,
          temperature: 20,
          allowablePressureDrop: 0.5,
          pressureUnit: 'MPa' as const,
          temperatureUnit: 'C' as const,
          intermediateStages: [
            { time: 60, pressure: 5, duration: 30 }, // 1 hour to 5 MPa, hold 30 min
            { time: 120, pressure: 10, duration: 60 }, // 2 hours to 10 MPa, hold 1 hour
          ],
        },
        isPublic: true,
        isSystemTemplate: true,
      },
      {
        name: 'Extended Pressure Test',
        description: '48-hour extended pressure test for long-term stability verification',
        category: 'extended',
        config: {
          workingPressure: 12,
          maxPressure: 18,
          testDuration: 48,
          temperature: 20,
          allowablePressureDrop: 0.3,
          pressureUnit: 'MPa' as const,
          temperatureUnit: 'C' as const,
          intermediateStages: [
            { time: 60, pressure: 4, duration: 30 },
            { time: 120, pressure: 8, duration: 60 },
            { time: 180, pressure: 12, duration: 120 },
          ],
        },
        isPublic: true,
        isSystemTemplate: true,
      },
      {
        name: 'Regulatory Compliance Test',
        description: 'Regulatory standard pressure test according to ASME B31.3',
        category: 'regulatory',
        config: {
          workingPressure: 15,
          maxPressure: 22.5, // 1.5x working pressure as per ASME B31.3
          testDuration: 24,
          temperature: 20,
          allowablePressureDrop: 0.2,
          pressureUnit: 'MPa' as const,
          temperatureUnit: 'C' as const,
          intermediateStages: [
            { time: 60, pressure: 7.5, duration: 30 },
            { time: 120, pressure: 15, duration: 60 },
          ],
          notes: 'Test conducted in accordance with ASME B31.3 Section 345',
        },
        isPublic: true,
        isSystemTemplate: true,
      },
      {
        name: 'Quick Leak Test',
        description: 'Short-duration test for quick leak detection after repairs',
        category: 'custom',
        config: {
          workingPressure: 8,
          maxPressure: 12,
          testDuration: 2,
          temperature: 20,
          allowablePressureDrop: 0.1,
          pressureUnit: 'MPa' as const,
          temperatureUnit: 'C' as const,
          intermediateStages: [],
        },
        isPublic: true,
        isSystemTemplate: true,
      },
      {
        name: 'High-Pressure Pipeline Test',
        description: 'High-pressure test for critical pipeline systems',
        category: 'extended',
        config: {
          workingPressure: 20,
          maxPressure: 30,
          testDuration: 36,
          temperature: 20,
          allowablePressureDrop: 0.4,
          pressureUnit: 'MPa' as const,
          temperatureUnit: 'C' as const,
          intermediateStages: [
            { time: 60, pressure: 10, duration: 30 },
            { time: 120, pressure: 15, duration: 60 },
            { time: 180, pressure: 20, duration: 120 },
          ],
        },
        isPublic: true,
        isSystemTemplate: true,
      },
      {
        name: 'Low-Pressure System Test',
        description: 'Low-pressure test for residential or low-pressure systems',
        category: 'daily',
        config: {
          workingPressure: 0.5,
          maxPressure: 0.75,
          testDuration: 12,
          temperature: 20,
          allowablePressureDrop: 0.05,
          pressureUnit: 'MPa' as const,
          temperatureUnit: 'C' as const,
          intermediateStages: [
            { time: 30, pressure: 0.25, duration: 15 },
            { time: 60, pressure: 0.5, duration: 30 },
          ],
        },
        isPublic: true,
        isSystemTemplate: true,
      },
    ];

    // Insert templates
    let createdCount = 0;
    for (const template of templates) {
      const [created] = await db
        .insert(testTemplates)
        .values({
          id: randomUUID(),
          name: template.name,
          description: template.description,
          organizationId: organization.id,
          createdBy: systemUser.id,
          category: template.category,
          config: template.config,
          isPublic: template.isPublic,
          isSystemTemplate: template.isSystemTemplate,
          usageCount: 0,
          lastUsedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log(`✅ Created template: ${created.name} (${created.category})`);
      createdCount++;
    }

    console.log('\n🎉 Template seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - ${createdCount} system templates created`);
    console.log(`  - Categories: daily (${templates.filter((t) => t.category === 'daily').length}), extended (${templates.filter((t) => t.category === 'extended').length}), regulatory (${templates.filter((t) => t.category === 'regulatory').length}), custom (${templates.filter((t) => t.category === 'custom').length})`);
    console.log('\n💡 Tips:');
    console.log('  - Access templates in Settings → Templates tab');
    console.log('  - Use templates when creating new tests');
    console.log('  - System templates cannot be edited or deleted');

  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the seed function
seedTemplates().catch((error) => {
  console.error('Fatal error during template seeding:', error);
  process.exit(1);
});
