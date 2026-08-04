import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { ADMIN_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '../src/lib/admin/permissions.shared';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- STARTING IDEMPOTENT SEEDING ---');

  // 1. Create All Permissions
  const permissionList = Object.values(ADMIN_PERMISSIONS);
  const createdPerms: Record<string, string> = {};

  for (const permName of permissionList) {
    const perm = await prisma.permission.upsert({
      where: { name: permName },
      update: { description: `Permission for ${permName}` },
      create: { name: permName, description: `Permission for ${permName}` },
    });
    createdPerms[permName] = perm.id;
  }
  console.log(`✓ Permissions seeded: ${permissionList.length}`);

  // 2. Create Roles and Assign Permissions
  const roles = [
    { name: 'SUPER_ADMIN', desc: 'Full hospital system and CMS administrator' },
    { name: 'HOSPITAL_ADMIN', desc: 'Clinical operations and hospital content manager' },
    { name: 'CONTENT_EDITOR', desc: 'Bilingual content drafter and media editor' },
    { name: 'RECEPTIONIST', desc: 'Front-desk appointment and patient enquiry coordinator' },
  ];

  const createdRoles: Record<string, string> = {};
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.desc },
      create: { name: r.name, description: r.desc },
    });
    createdRoles[r.name] = role.id;

    const assignedPerms = DEFAULT_ROLE_PERMISSIONS[r.name as keyof typeof DEFAULT_ROLE_PERMISSIONS] || [];
    for (const pName of assignedPerms) {
      if (createdPerms[pName]) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: createdPerms[pName],
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: createdPerms[pName],
          },
        });
      }
    }
  }
  console.log(`✓ Roles seeded: ${roles.length}`);

  // 3. Create Super Admin User
  const adminEmail = process.env.DEMO_ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || 'admin@subison-demo.local';
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || 'Demo@12345678';
  const adminName = process.env.SEED_ADMIN_NAME || 'Super Administrator';

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash,
      isActive: true,
      failedLogins: 0,
      lockedUntil: null,
    },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash,
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: createdRoles['SUPER_ADMIN'],
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: createdRoles['SUPER_ADMIN'],
    },
  });
  console.log(`✓ Super Admin seeded: ${superAdmin.email}`);

  // 4. Department
  const department = await prisma.department.upsert({
    where: { name: 'Neurology & Neurosurgery' },
    update: { description: 'Advanced Neurological & Spinal Care' },
    create: {
      name: 'Neurology & Neurosurgery',
      description: 'Advanced Neurological & Spinal Care',
    },
  });
  console.log(`✓ Department seeded: ${department.name}`);

  // 5. Doctor & Profile
  let doctor = await prisma.doctor.findFirst({
    where: { name: 'Dr. C. Subbiah' },
  });

  if (!doctor) {
    doctor = await prisma.doctor.create({
      data: {
        name: 'Dr. C. Subbiah',
        qualifications: 'M.B.B.S, M.S., M.Ch. (Neurosurgery)',
        specialisation: 'Senior Neurosurgeon & Spine Specialist',
        experience: '25+ Years',
        registration: 'TN-45892',
        bio: 'Senior Consultant Neurosurgeon specializing in comprehensive cranial, neurovascular, and spinal interventions.',
        consultationFee: 200,
        departmentId: department.id,
      },
    });
  } else {
    doctor = await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        qualifications: 'M.B.B.S, M.S., M.Ch. (Neurosurgery)',
        specialisation: 'Senior Neurosurgeon & Spine Specialist',
        experience: '25+ Years',
        registration: 'TN-45892',
        consultationFee: 200,
        departmentId: department.id,
      },
    });
  }

  await prisma.doctorProfile.upsert({
    where: { doctorId: doctor.id },
    update: {
      qualifications: 'M.B.B.S, M.S., M.Ch. (Neurosurgery)',
      registrationNumber: 'TN-45892',
      specialisation: 'Senior Neurosurgeon & Spine Specialist',
      experienceYears: 25,
      consultationFee: 200,
      isVerified: true,
      status: 'PUBLISHED',
      bioEn: 'Senior Consultant Neurosurgeon specializing in comprehensive cranial and spinal interventions.',
      bioTa: 'மூளை மற்றும் தண்டுவட அறுவை சிகிச்சை நிபுணர்.',
    },
    create: {
      doctorId: doctor.id,
      qualifications: 'M.B.B.S, M.S., M.Ch. (Neurosurgery)',
      registrationNumber: 'TN-45892',
      specialisation: 'Senior Neurosurgeon & Spine Specialist',
      experienceYears: 25,
      consultationFee: 200,
      isVerified: true,
      status: 'PUBLISHED',
      bioEn: 'Senior Consultant Neurosurgeon specializing in comprehensive cranial and spinal interventions.',
      bioTa: 'மூளை மற்றும் தண்டுவட அறுவை சிகிச்சை நிபுணர்.',
    },
  });
  console.log(`✓ Doctor & DoctorProfile seeded: ${doctor.name}`);

  // 6. Doctor Availability (Monday=1 to Saturday=6)
  for (let day = 1; day <= 6; day++) {
    const existingAvail = await prisma.doctorAvailability.findFirst({
      where: { doctorId: doctor.id, dayOfWeek: day },
    });

    if (!existingAvail) {
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek: day,
          startTime: '18:00',
          endTime: '22:00',
          slotDuration: 15,
          maxBookings: 2,
          capacity: 2,
        },
      });
    } else {
      await prisma.doctorAvailability.update({
        where: { id: existingAvail.id },
        data: {
          startTime: '18:00',
          endTime: '22:00',
          slotDuration: 15,
          maxBookings: 2,
          capacity: 2,
        },
      });
    }
  }
  console.log(`✓ Doctor availabilities seeded (Mon-Sat, 18:00-22:00, cap=2)`);

  // 7. Specialities (Bilingual)
  const strokeSpec = await prisma.speciality.upsert({
    where: { slug: 'stroke-care' },
    update: { status: 'PUBLISHED', isFeatured: true, displayOrder: 1 },
    create: { slug: 'stroke-care', status: 'PUBLISHED', isFeatured: true, displayOrder: 1 },
  });

  await prisma.specialityTranslation.upsert({
    where: { specialityId_locale: { specialityId: strokeSpec.id, locale: 'en' } },
    update: {
      title: 'Comprehensive Stroke & Neurovascular Care',
      summary: '24/7 emergency stroke triage, thrombolysis, and specialized neuro-rehabilitation protocols.',
      overview: 'Rapid acute assessment and evidence-based neurovascular care for ischemic and hemorrhagic stroke.',
    },
    create: {
      specialityId: strokeSpec.id,
      locale: 'en',
      title: 'Comprehensive Stroke & Neurovascular Care',
      summary: '24/7 emergency stroke triage, thrombolysis, and specialized neuro-rehabilitation protocols.',
      overview: 'Rapid acute assessment and evidence-based neurovascular care for ischemic and hemorrhagic stroke.',
    },
  });

  await prisma.specialityTranslation.upsert({
    where: { specialityId_locale: { specialityId: strokeSpec.id, locale: 'ta' } },
    update: {
      title: 'பக்கவாத தீவிர சிகிச்சை',
      summary: 'பக்கவாதத்திற்கான 24 மணி நேர அவசர சிகிச்சை மற்றும் மறுவாழ்வு.',
      overview: 'நவீன மருத்துவ தொழில்நுட்பத்துடன் கூடிய பக்கவாத மேலாண்மை.',
    },
    create: {
      specialityId: strokeSpec.id,
      locale: 'ta',
      title: 'பக்கவாத தீவிர சிகிச்சை',
      summary: 'பக்கவாதத்திற்கான 24 மணி நேர அவசர சிகிச்சை மற்றும் மறுவாழ்வு.',
      overview: 'நவீன மருத்துவ தொழில்நுட்பத்துடன் கூடிய பக்கவாத மேலாண்மை.',
    },
  });

  // 8. Treatments (Bilingual)
  const spineTreatment = await prisma.treatment.upsert({
    where: { slug: 'minimally-invasive-spine-surgery' },
    update: { status: 'PUBLISHED', displayOrder: 1 },
    create: { slug: 'minimally-invasive-spine-surgery', status: 'PUBLISHED', displayOrder: 1 },
  });

  await prisma.treatmentTranslation.upsert({
    where: { treatmentId_locale: { treatmentId: spineTreatment.id, locale: 'en' } },
    update: {
      title: 'Minimally Invasive Spine Surgery',
      summary: 'Advanced micro-endoscopic decompression and stabilization for lumbar and cervical conditions.',
      overview: 'High-precision surgical options targeting rapid recovery, minimal tissue trauma, and durable pain relief.',
    },
    create: {
      treatmentId: spineTreatment.id,
      locale: 'en',
      title: 'Minimally Invasive Spine Surgery',
      summary: 'Advanced micro-endoscopic decompression and stabilization for lumbar and cervical conditions.',
      overview: 'High-precision surgical options targeting rapid recovery, minimal tissue trauma, and durable pain relief.',
    },
  });

  await prisma.treatmentTranslation.upsert({
    where: { treatmentId_locale: { treatmentId: spineTreatment.id, locale: 'ta' } },
    update: {
      title: 'நுண்ணோக்கி தண்டுவட அறுவை சிகிச்சை',
      summary: 'தண்டுவட பிரச்சனைகளுக்கான அதிநவீன குறைந்தபட்ச ஊடுருவல் சிகிச்சை.',
      overview: 'விரைவான குணமடைதல் மற்றும் குறைந்த வலி கொண்ட அறுவை சிகிச்சை.',
    },
    create: {
      treatmentId: spineTreatment.id,
      locale: 'ta',
      title: 'நுண்ணோக்கி தண்டுவட அறுவை சிகிச்சை',
      summary: 'தண்டுவட பிரச்சனைகளுக்கான அதிநவீன குறைந்தபட்ச ஊடுருவல் சிகிச்சை.',
      overview: 'விரைவான குணமடைதல் மற்றும் குறைந்த வலி கொண்ட அறுவை சிகிச்சை.',
    },
  });
  console.log(`✓ Specialities and Treatments seeded with EN/TA translations`);

  // 9. Initial Site Settings
  const initialSettings = {
    hospitalName: 'Subison Neuro Centre',
    phone: '+91 63836 36281',
    emergencyPhone: '+91 63836 36281',
    consultationHours: 'Monday to Saturday, 6:00 PM to 10:00 PM',
    appointmentFee: '200',
    locationCoordinates: '8.1592044, 77.4085451',
    address: 'Subison Neuro Centre, Kanyakumari Main Road, Nagercoil, Tamil Nadu 629001',
    email: 'contact@subisonneuro.com',
  };

  for (const [key, value] of Object.entries(initialSettings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    });
  }
  console.log(`✓ Site settings seeded`);

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
