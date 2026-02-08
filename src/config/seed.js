// ========================================
// SEED DATA SCRIPT
// Adds sample data to database
// ========================================

const { sequelize, testConnection } = require('./config/database');
const bcrypt = require('bcryptjs');

// Import models
const {
  User,
  Partner,
  Vehicle,
  VehiclePartner,
  Farm,
  Buyer,
  ChickenType,
  CostCategory,
  Permission,UserPermission
} = require('./models');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function seed() {
  try {
    log('\n🌱 Starting database seeding...', 'blue');

    // Test connection
    const connected = await testConnection();
    if (!connected) {
      log('❌ Cannot connect to database', 'red');
      process.exit(1);
    }

    // ============================================
    // 1. USERS
    // ============================================
    log('\n👤 Creating users...', 'blue');
    
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password_hash: 'admin123', // Will be hashed by model hook
        full_name: 'مدير النظام',
        email: 'admin@chicken.local',
        is_active: true
      });
      log('   ✅ Admin created (username: admin, password: admin123)', 'green');
    } else {
      log('   ⏭️  Admin already exists', 'yellow');
    }

    const userExists = await User.findOne({ where: { username: 'user' } });
    if (!userExists) {
      await User.create({
        username: 'user',
        password_hash: 'user123',
        full_name: 'مستخدم عادي',
        email: 'user@chicken.local',
        is_active: true
      });
      log('   ✅ User created (username: user, password: user123)', 'green');
    } else {
      log('   ⏭️  User already exists', 'yellow');
    }

    // ============================================
    // 2. CHICKEN TYPES
    // ============================================
    log('\n🐔 Creating chicken types...', 'blue');
    
    const chickenTypes = [
      { name: 'دجاج أبيض', description: 'White broiler chicken' },
      { name: 'دجاج أحمر', description: 'Red broiler chicken' },
      { name: 'دجاج بلدي', description: 'Local/farm chicken' },
      { name: 'دجاج ساسو', description: 'Sasso chicken' }
    ];

    for (const type of chickenTypes) {
      const [created, isNew] = await ChickenType.findOrCreate({
        where: { name: type.name },
        defaults: type
      });
      log(`   ${isNew ? '✅ Created' : '⏭️  Exists'}: ${type.name}`, isNew ? 'green' : 'yellow');
    }

    // ============================================
    // 3. COST CATEGORIES
    // ============================================
    log('\n💰 Creating cost categories...', 'blue');
    
    const costCategories = [
      { name: 'وقود', description: 'Fuel costs', is_vehicle_cost: true },
      { name: 'صيانة العربية', description: 'Vehicle maintenance', is_vehicle_cost: true },
      { name: 'رسوم طريق', description: 'Highway tolls', is_vehicle_cost: true },
      { name: 'غسيل العربية', description: 'Vehicle washing', is_vehicle_cost: true },
      { name: 'عمالة', description: 'Labor costs', is_vehicle_cost: false },
      { name: 'ثلج', description: 'Ice for cooling', is_vehicle_cost: false },
      { name: 'أقفاص', description: 'Cage rental/purchase', is_vehicle_cost: false },
      { name: 'مصاريف إدارية', description: 'Administrative expenses', is_vehicle_cost: false },
      { name: 'كراتين', description: 'Boxes/packaging', is_vehicle_cost: false }
    ];

    for (const category of costCategories) {
      const [created, isNew] = await CostCategory.findOrCreate({
        where: { name: category.name },
        defaults: category
      });
      log(`   ${isNew ? '✅ Created' : '⏭️  Exists'}: ${category.name} (Vehicle: ${category.is_vehicle_cost})`, isNew ? 'green' : 'yellow');
    }

    // ============================================
    // 4. PARTNERS
    // ============================================
    log('\n👥 Creating partners...', 'blue');
    
    const partners = [
      {
        name: 'محمد أحمد',
        phone: '01234567890',
        address: 'القاهرة، مصر',
        investment_amount: 100000,
        investment_percentage: 40,
        is_vehicle_partner: true
      },
      {
        name: 'أحمد محمود',
        phone: '01234567891',
        address: 'الجيزة، مصر',
        investment_amount: 87500,
        investment_percentage: 35,
        is_vehicle_partner: true
      },
      {
        name: 'خالد حسن',
        phone: '01234567892',
        address: 'الإسكندرية، مصر',
        investment_amount: 62500,
        investment_percentage: 25,
        is_vehicle_partner: false
      }
    ];

    for (const partner of partners) {
      const [created, isNew] = await Partner.findOrCreate({
        where: { name: partner.name },
        defaults: partner
      });
      log(`   ${isNew ? '✅ Created' : '⏭️  Exists'}: ${partner.name} (${partner.investment_percentage}% - Vehicle: ${partner.is_vehicle_partner})`, isNew ? 'green' : 'yellow');
    }

    // ============================================
    // 5. VEHICLE
    // ============================================
    log('\n🚛 Creating vehicle...', 'blue');
    
    const [vehicle, vehicleCreated] = await Vehicle.findOrCreate({
      where: { plate_number: 'ABC 123' },
      defaults: {
        name: 'Toyota Truck',
        purchase_price: 150000,
        empty_weight: 3500,
        plate_number: 'ABC 123'
      }
    });

    if (vehicleCreated) {
      log(`   ✅ Vehicle created: ${vehicle.name}`, 'green');
      
      // Assign to vehicle partners
      const vehiclePartners = await Partner.findAll({ where: { is_vehicle_partner: true } });
      const sharePercentage = 100 / vehiclePartners.length;

      for (const partner of vehiclePartners) {
        await VehiclePartner.findOrCreate({
          where: { vehicle_id: vehicle.id, partner_id: partner.id },
          defaults: {
            vehicle_id: vehicle.id,
            partner_id: partner.id,
            share_percentage: sharePercentage.toFixed(2)
          }
        });
      }
      log(`   ✅ Assigned to ${vehiclePartners.length} partners`, 'green');
    } else {
      log('   ⏭️  Vehicle already exists', 'yellow');
    }

    // ============================================
    // 6. FARMS
    // ============================================
    log('\n🏡 Creating farms...', 'blue');
    
    const farms = [
      {
        name: 'مزرعة النور',
        owner_name: 'عبد الله محمد',
        location: 'الفيوم، مصر',
        phone: '01111111111',
        current_balance: 0
      },
      {
        name: 'مزرعة الأمل',
        owner_name: 'حسن علي',
        location: 'بني سويف، مصر',
        phone: '01222222222',
        current_balance: 0
      },
      {
        name: 'مزرعة الخير',
        owner_name: 'سعيد أحمد',
        location: 'المنيا، مصر',
        phone: '01333333333',
        current_balance: 0
      }
    ];

    for (const farm of farms) {
      const [created, isNew] = await Farm.findOrCreate({
        where: { name: farm.name },
        defaults: farm
      });
      log(`   ${isNew ? '✅ Created' : '⏭️  Exists'}: ${farm.name} - ${farm.owner_name}`, isNew ? 'green' : 'yellow');
    }

    // ============================================
    // 7. BUYERS
    // ============================================
    log('\n🛒 Creating buyers...', 'blue');
    
    const buyers = [
      {
        name: 'محل الطيور',
        phone: '01444444444',
        address: 'شارع الجمهورية، القاهرة',
        total_debt: 0
      },
      {
        name: 'سوبر ماركت النور',
        phone: '01555555555',
        address: 'شارع الهرم، الجيزة',
        total_debt: 0
      },
      {
        name: 'مطعم الفراخ الذهبية',
        phone: '01666666666',
        address: 'ميدان التحرير، القاهرة',
        total_debt: 0
      }
    ];

    for (const buyer of buyers) {
      const [created, isNew] = await Buyer.findOrCreate({
        where: { name: buyer.name },
        defaults: buyer
      });
      log(`   ${isNew ? '✅ Created' : '⏭️  Exists'}: ${buyer.name}`, isNew ? 'green' : 'yellow');
    }
// ============================================
// 1.5 PERMISSIONS
// ============================================
log('\n🔐 Creating permissions...', 'blue');

const now = new Date();

 const permissions = [
  // ========================================
  // النظام
  // ========================================
  {
    key: 'APPLICATION_ADMIN',
    name: 'أدمن التطبيق',
    description: 'صلاحية كاملة للتحكم في جميع أجزاء النظام بدون قيود',
    category: 'النظام',
    is_active: true,
    created_at: now,
    updated_at: now
  },

  // ========================================
  // المستخدمين
  // ========================================
  {
    key: 'MANAGE_USERS',
    name: 'إدارة المستخدمين',
    description: 'إضافة وتعديل وحذف المستخدمين',
    category: 'المستخدمين',
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    key: 'VIEW_USERS',
    name: 'عرض المستخدمين',
    description: 'عرض قائمة المستخدمين وبياناتهم',
    category: 'المستخدمين',
    is_active: true,
    created_at: now,
    updated_at: now
  },

  // ========================================
  // الشركاء
  // ========================================
  {
    key: 'MANAGE_PARTNERS',
    name: 'إدارة الشركاء',
    description: 'إضافة وتعديل وحذف الشركاء',
    category: 'الشركاء',
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    key: 'VIEW_PARTNERS',
    name: 'عرض الشركاء',
    description: 'عرض بيانات الشركاء',
    category: 'الشركاء',
    is_active: true,
    created_at: now,
    updated_at: now
  },

  // ========================================
  // المزارع
  // ========================================
  {
    key: 'MANAGE_FARMS',
    name: 'إدارة المزارع',
    description: 'إضافة وتعديل وحذف المزارع',
    category: 'المزارع',
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    key: 'VIEW_FARMS',
    name: 'عرض المزارع',
    description: 'عرض بيانات وحركات المزارع',
    category: 'المزارع',
    is_active: true,
    created_at: now,
    updated_at: now
  },

  // ========================================
  // العملاء (محلات الفراخ)
  // ========================================
  {
    key: 'MANAGE_BUYERS',
    name: 'إدارة العملاء',
    description: 'إضافة وتعديل وحذف العملاء',
    category: 'محلات الفراخ',
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    key: 'VIEW_BUYERS',
    name: 'عرض العملاء',
    description: 'عرض بيانات العملاء',
    category: 'محلات الفراخ',
    is_active: true,
    created_at: now,
    updated_at: now
  },

  // ========================================
  // المركبات
  // ========================================
  {
    key: 'MANAGE_VEHICLES',
    name: 'إدارة السيارات',
    description: 'إضافة وتعديل وحذف السيارات',
    category: 'المركبات',
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    key: 'VIEW_VEHICLES',
    name: 'عرض السيارات',
    description: 'عرض بيانات السيارات',
    category: 'المركبات',
    is_active: true,
    created_at: now,
    updated_at: now
  },

  // ========================================
  // إغلاق اليوم
  // ========================================
  {
    key: 'CLOSE_OPERATION',
    name: 'إغلاق العملية اليومية',
    description: 'إغلاق اليوم لكل عمليات التشغيل',
    category: 'اغلاق اليوم',
    is_active: true,
    created_at: now,
    updated_at: now
  },

  // ========================================
  // العمليات
  // ========================================
  {
    key: 'RECORD_FARM_LOADING',
    name: 'تسجيل تحميل من مزرعة',
    description: 'تسجيل كميات التحميل من المزارع',
    category: 'العمليات',
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    key: 'RECORD_SALE',
    name: 'تسجيل عملية بيع',
    description: 'تسجيل عمليات البيع',
    category: 'العمليات',
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    key: 'RECORD_TRANSPORT_LOSS',
    name: 'تسجيل فاقد النقل',
    description: 'تسجيل فاقد النقل أثناء التشغيل',
    category: 'العمليات',
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    key: 'RECORD_COST',
    name: 'تسجيل التكاليف',
    description: 'تسجيل التكاليف اليومية',
    category: 'العمليات',
    is_active: true,
    created_at: now,
    updated_at: now
  },

  // ========================================
  // الدواجن
  // ========================================
  {
    key: 'MANAGE_CHICKEN_TYPES',
    name: 'إدارة أنواع الدواجن',
    description: 'إضافة وتعديل أنواع الدواجن',
    category: 'الدواجن',
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    key: 'VIEW_CHICKEN_TYPES',
    name: 'عرض انواع الدواجن',
    description: 'عرض انواع الدواجن',
    category: 'الدواجن',
    is_active: true,
    created_at: now,
    updated_at: now
  },

  // ========================================
  // التكاليف
  // ========================================
  {
    key: 'MANAGE_COST_CATEGORIES',
    name: 'إدارة بنود التكاليف',
    description: 'إضافة وتعديل بنود التكاليف',
    category: 'التكاليف',
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    key: 'VIEW_COST_CATEGORIES',
    name: 'عرض انواع التكاليف',
    description: 'عرض انواع التكاليف',
    category: 'التكاليف',
    is_active: true,
    created_at: now,
    updated_at: now
  },

  // ========================================
  // التقارير
  // ========================================
  {
    key: 'VIEW_DAILY_REPORT',
    name: 'عرض التقرير اليومي',
    description: 'عرض تقرير التشغيل اليومي',
    category: 'التقارير',
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    key: 'VIEW_PERIOD_REPORT',
    name: 'عرض تقرير فترة',
    description: 'عرض تقارير حسب فترة زمنية',
    category: 'التقارير',
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    key: 'VIEW_PROFIT_REPORT',
    name: 'عرض تقارير الأرباح',
    description: 'عرض تقارير الأرباح والتوزيع',
    category: 'التقارير',
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    key: 'VIEW_DEBT_REPORT',
    name: 'عرض تقارير المديونيات',
    description: 'عرض تقارير ديون المزارع والعملاء',
    category: 'التقارير',
    is_active: true,
    created_at: now,
    updated_at: now
  }
];

for (const permission of permissions) {
  const [created, isNew] = await Permission.findOrCreate({
    where: { key: permission.key },
    defaults: permission
  });

  log(
    `   ${isNew ? '✅ Created' : '⏭️  Exists'}: ${permission.key}`,
    isNew ? 'green' : 'yellow'
  );
}


// ============================================
// ASSIGN APPLICATION_ADMIN TO ADMIN ONLY
// ============================================
log('\n🛡️ Assigning APPLICATION_ADMIN to admin...', 'blue');

const admin = await User.findOne({ where: { username: 'admin' } });
const adminPermission = await Permission.findOne({
  where: { key: 'APPLICATION_ADMIN' }
});

if (!admin) {
  log('   ❌ Admin user not found', 'red');
} else if (!adminPermission) {
  log('   ❌ APPLICATION_ADMIN permission not found', 'red');
} else {
  await UserPermission.findOrCreate({
    where: {
      user_id: admin.id,
      permission_id: adminPermission.id
    },
    defaults: {
      user_id: admin.id,
      permission_id: adminPermission.id,
      granted_by: admin.id // self granted (system admin)
    }
  });

  log('   ✅ APPLICATION_ADMIN assigned to admin', 'green');
}



    // ============================================
    // SUMMARY
    // ============================================
    log('\n' + '='.repeat(50), 'blue');
    log('🎉 Database seeding completed!', 'green');
    log('='.repeat(50), 'blue');
    log('\n📊 Summary:', 'blue');
    log(`   - Users: ${await User.count()}`, 'yellow');
    log(`   - Partners: ${await Partner.count()}`, 'yellow');
    log(`   - Vehicles: ${await Vehicle.count()}`, 'yellow');
    log(`   - Farms: ${await Farm.count()}`, 'yellow');
    log(`   - Buyers: ${await Buyer.count()}`, 'yellow');
    log(`   - Chicken Types: ${await ChickenType.count()}`, 'yellow');
    log(`   - Cost Categories: ${await CostCategory.count()}`, 'yellow');
    
    log('\n🚀 Next steps:', 'blue');
    log('   1. Start your backend: npm run dev', 'yellow');
    log('   2. Login with: admin / admin123\n', 'yellow');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    console.error('\nError details:', error.message);
    if (error.stack) console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

// Run seeding
seed();