import { db } from './index';
import { users, projects, pressureTests, organizations } from './schema';
import { randomUUID } from 'crypto';

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create test organization
    const [organization] = await db.insert(organizations).values({
      id: randomUUID(),
      name: 'Test Organization',
      slug: 'test-org',
      planType: 'pro',
      settings: {
        defaultLanguage: 'en',
        allowPublicSharing: true,
        requireApprovalForTests: false,
        maxTestDuration: 48,
        customBranding: { enabled: false }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log('✅ Created organization:', organization.name);

    // Create test user
    const [user] = await db.insert(users).values({
      id: randomUUID(),
      username: 'testuser',
      name: 'Test User',
      email: 'test@pressograph.dev',
      emailVerified: new Date(),
      image: null,
      organizationId: organization.id,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log('✅ Created user:', user.username, '(' + user.email + ')');

    // Create test project
    const [project] = await db.insert(projects).values({
      id: randomUUID(),
      name: 'Sample Project',
      description: 'Sample project for testing pressure tests',
      organizationId: organization.id,
      ownerId: user.id,
      isArchived: false,
      settings: {
        autoNumberTests: true,
        testNumberPrefix: 'PT',
        requireNotes: false,
        defaultTemplateType: 'daily'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log('✅ Created project:', project.name);

    // Create sample pressure tests
    const testData = [
      {
        name: 'Initial System Test',
        testNumber: 'PT-001',
        description: 'Initial pressure test for system commissioning',
        status: 'completed' as const,
        parameters: {
          initialPressure: 100,
          finalPressure: 95,
          duration: 60,
          temperatureC: 20,
          medium: 'water'
        },
        results: {
          passed: true,
          finalPressure: 95,
          leakRate: 0.083,
          notes: 'Test completed successfully within acceptable parameters'
        }
      },
      {
        name: 'Daily Check #1',
        testNumber: 'PT-002',
        description: 'Routine daily pressure verification',
        status: 'in_progress' as const,
        parameters: {
          initialPressure: 150,
          finalPressure: 145,
          duration: 30,
          temperatureC: 22,
          medium: 'water'
        },
        results: null
      },
      {
        name: 'Maintenance Test',
        testNumber: 'PT-003',
        description: 'Post-maintenance system verification',
        status: 'pending' as const,
        parameters: {
          initialPressure: 200,
          finalPressure: null,
          duration: 120,
          temperatureC: 18,
          medium: 'air'
        },
        results: null
      }
    ];

    for (const testConfig of testData) {
      const [test] = await db.insert(pressureTests).values({
        id: randomUUID(),
        projectId: project.id,
        organizationId: organization.id,
        name: testConfig.name,
        description: testConfig.description,
        testNumber: testConfig.testNumber,
        status: testConfig.status,
        config: {
          workingPressure: testConfig.parameters.initialPressure,
          maxPressure: testConfig.parameters.initialPressure * 1.5,
          testDuration: testConfig.parameters.duration / 60, // convert minutes to hours
          temperature: testConfig.parameters.temperatureC,
          allowablePressureDrop: 0.1,
          intermediateStages: [],
          pressureUnit: 'MPa',
          temperatureUnit: 'C',
          notes: testConfig.description,
        },
        templateType: 'custom',
        tags: ['sample', 'test'],
        isPublic: false,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      console.log(`✅ Created pressure test: ${test.name} (${test.testNumber})`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - 1 organization created');
    console.log('  - 1 user created');
    console.log('  - 1 project created');
    console.log('  - 3 pressure tests created');
    console.log('\n🔑 Test Credentials:');
    console.log('  Username: testuser (use this to log in!)');
    console.log('  Email: test@pressograph.dev (for recovery only)');
    console.log('  Password: Use scripts/set-test-password.ts to set');
    console.log('  Organization: test-org');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the seed function
seed().catch((error) => {
  console.error('Fatal error during seeding:', error);
  process.exit(1);
});