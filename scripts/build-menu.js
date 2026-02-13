#!/usr/bin/env node
/**
 * Builds menu.json from the Chef Special menu spec with full modifiers.
 * Run: node scripts/build-menu.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Reusable modifier option: (name, price) => { name, price }
const opt = (name, price) => ({ name, price: price === undefined || price === 'Free' ? 0 : price });

// Reusable modifier groups (required: true = Choose one, false = Optional)
const sugarLevelFull = {
  id: 'sugar',
  name: 'Sugar Level (甜度)',
  required: true,
  options: [
    opt('No Sugar / 无糖（0%）', 0),
    opt('Light Sugar / 微糖（25%）', 0),
    opt('Less Sugar / 半糖（50%）', 0),
    opt('Regular Sugar / 正常糖（100%）', 0),
    opt('More Sugar / 多糖（120%）', 1),
  ],
};
const sugarLevelRegularMore = {
  id: 'sugar',
  name: 'Sugar Level (甜度)',
  required: true,
  options: [
    opt('Regular Sugar / 正常糖（100%）', 0),
    opt('More Sugar / 多糖（120%）', 1),
  ],
};
const toppingsBoba = {
  id: 'toppings',
  name: 'Toppings (加料)',
  required: false,
  options: [
    opt('Milk Cap Instead Of Boba / 珍珠换奶盖', 0.75),
    opt('Tapioca Boba / 珍珠', 0.60),
    opt('Pudding / 布丁', 0.50),
    opt('Sweet Red Bean / 台湾红豆泥', 0.50),
    opt('Mango Juicy Pearls / 芒果爆珠', 0.75),
    opt('Mango Jelly / 芒果椰果', 0.44),
    opt('Coffee Jelly / 咖啡椰果', 0.66),
    opt('Mango Konnyaku Jelly / 芒果脆波波', 0.75),
    opt('Black Sugar Konnyaku Jelly / 黑糖脆波波', 0.75),
    opt('Konnyaku Jelly / 原味脆波波', 0.75),
    opt('Boba Exchange To Brown Sugar Boba / 珍珠换黑糖脆波波', 0.50),
  ],
};
const toppingsBobaNoExchange = {
  id: 'toppings',
  name: 'Toppings (加料)',
  required: false,
  options: [
    opt('Milk Cap Instead Of Boba / 珍珠换奶盖', 0.75),
    opt('Tapioca Boba / 珍珠', 0.60),
    opt('Pudding / 布丁', 0.50),
    opt('Sweet Red Bean / 台湾红豆泥', 0.50),
    opt('Mango Juicy Pearls / 芒果爆珠', 0.75),
    opt('Mango Jelly / 芒果椰果', 0.44),
    opt('Coffee Jelly / 咖啡椰果', 0.66),
    opt('Mango Konnyaku Jelly / 芒果脆波波', 0.75),
    opt('Black Sugar Konnyaku Jelly / 黑糖脆波波', 0.75),
    opt('Konnyaku Jelly / 原味脆波波', 0.75),
  ],
};
const toppingsNoMilkCap = {
  id: 'toppings',
  name: 'Toppings (加料)',
  required: false,
  options: [
    opt('Tapioca Boba / 珍珠', 0.60),
    opt('Pudding / 布丁', 0.50),
    opt('Sweet Red Bean / 台湾红豆泥', 0.50),
    opt('Mango Juicy Pearls / 芒果爆珠', 0.75),
    opt('Mango Jelly / 芒果椰果', 0.44),
    opt('Coffee Jelly / 咖啡椰果', 0.66),
    opt('Mango Konnyaku Jelly / 芒果脆波波', 0.75),
    opt('Black Sugar Konnyaku Jelly / 黑糖脆波波', 0.75),
    opt('Konnyaku Jelly / 原味脆波波', 0.75),
  ],
};
const iceLevelBasic = {
  id: 'ice',
  name: 'Ice Level (冰度)',
  required: true,
  options: [
    opt('Regular Ice / 正常冰', 0),
    opt('Less Ice / 少冰', 0),
  ],
};
const iceLevelHot = {
  id: 'ice',
  name: 'Ice Level (冰度)',
  required: true,
  options: [
    opt('Hot / 热', 0),
    opt('Warm / 温热', 0),
    opt('Regular Ice / 正常冰', 0),
    opt('Less Ice / 少冰', 0),
    opt('No Ice / 去冰', 0),
  ],
};
const milkUpgrade = {
  id: 'milk_upgrade',
  name: 'Milk Upgrade (牛奶升级)',
  required: false,
  options: [
    opt('Almond Milk / 升级杏仁奶', 0.50),
    opt('Soymilk / 升级豆奶', 0.50),
  ],
};
const addCheeseFoam = {
  id: 'cheese_foam',
  name: 'Add Cheese Foam (加奶盖)',
  required: false,
  options: [
    opt('Add Cheese Foam / 加奶盖', 0),
    opt('Extra Cheese Foam / 额外加奶盖', 1.50),
  ],
};
const addCheeseFoamExtraOnly = {
  id: 'cheese_foam',
  name: 'Add Cheese Foam (加奶盖)',
  required: false,
  options: [opt('Add Cheese Foam / 加奶盖', 1.50)],
};
const cupTypeLarge = {
  id: 'cup',
  name: 'Cup Type (杯型)',
  required: true,
  options: [opt('Large Cup / 大杯', 0)],
};
const flavorGarlic = {
  id: 'flavor',
  name: 'Flavor (口味)',
  required: true,
  options: [
    opt('Garlic / 田园沙拉酱', 2),
  ],
};
const flavorGarlicPepper = {
  id: 'flavor',
  name: 'Flavor (口味)',
  required: true,
  options: [
    opt('Garlic / 田园沙拉酱', 2),
    opt('Black Pepper / 黑胡椒', 20),
  ],
};
const addSauce = {
  id: 'sauce',
  name: 'Add Sauce (加酱汁)',
  required: false,
  options: [
    opt('Sweet & Sour Sauce / 甜酸酱', 1),
    opt('Ranch / 田园沙拉酱', 1.50),
    opt('HJ Spicy Sauce / HJ辣酱', 1),
  ],
};
const addSauceNoRanch = {
  id: 'sauce',
  name: 'Add Sauce (加酱汁)',
  required: false,
  options: [
    opt('Sweet & Sour Sauce / 甜酸酱', 1),
    opt('HJ Spicy Sauce / HJ辣酱', 1),
  ],
};
const addSauceHjOnly = {
  id: 'sauce',
  name: 'Add Sauce (加酱汁)',
  required: false,
  options: [opt('HJ Spicy Sauce / HJ辣酱', 1)],
};
const cheeseOption = {
  id: 'cheese_option',
  name: 'Cheese Option (起司酱选项)',
  required: true,
  options: [
    opt('Cheese Sauce On The Side / 起司酱分开', 0),
    opt('Cheese Sauce On It / 起司酱淋上', 0),
  ],
};
const spiceLevel = {
  id: 'spice',
  name: 'Spice Level (辣度)',
  required: true,
  options: [
    opt('Mild / 微辣', 2),
    opt('Medium Spicy / 中辣', 2),
    opt('Very Spicy / 超辣', 3),
  ],
};
const lunchCombo = {
  id: 'lunch_combo',
  name: 'Lunch Combo (午餐组合)',
  required: false,
  options: [
    opt('Mango Roll / 芒果卷', 3),
    opt('Spicy Tuna / 辣吞拿卷', 0),
  ],
};
const drinksJuiceCola = {
  id: 'drinks',
  name: 'Drinks (饮料)',
  required: true,
  options: [
    opt('Juice / 果汁', 0),
    opt('Cola / 可乐', 0),
  ],
};
const hotBlackTeaToppings = {
  id: 'toppings',
  name: 'Toppings (奶茶小料)',
  required: false,
  options: [
    opt('Pearl / 珍珠', 1),
    opt('Coconut Jelly / 椰果', 1),
    opt('Grape Pulp / 葡萄果肉', 0),
  ],
};
const cupTypeLargeMedium = {
  id: 'cup',
  name: 'Cup Type (杯型)',
  required: true,
  options: [
    opt('Large Cup / 大杯', 0),
    opt('Medium Cup / 中杯', 0),
  ],
};
const brothOptions = {
  id: 'broth',
  name: 'Double Flavor Broth (鸳鸯锅底选择)',
  required: true,
  options: [
    opt('Traditional Spicy Broth / 九门特色红油锅', 0),
    opt('Tomato Broth / 番茄浓汤锅', 0),
    opt('Spicy Tomato Broth / 山丹丹花开红艳艳', 0),
    opt('Mushroom Broth / 养生菌菇汤锅', 0),
    opt('Bone Marrow Broth / 原汁招牌大骨锅', 0),
    opt('Nourishing Chicken Broth / 滋补乌鸡锅', 0),
    opt('Pigs Trotters w. Yellow Bean Broth / 养颜蹄花锅', 0),
    opt('Fish Maw w. Shredded Chicken Broth / 金汤花椒鸡', 10.88),
  ],
};
const brothSpiceTraditional = {
  id: 'broth_spice_traditional',
  name: 'Spice Level for Traditional Spicy (牛油辣度)',
  required: false,
  options: [
    opt('No Spicy / 不要辣（牛油）', 0),
    opt('Tiny Spicy / 微辣（牛油）', 0),
    opt('Regular Spicy / 中辣（牛油）', 0),
    opt('Very Spicy / 重辣（牛油）', 0),
  ],
};
const brothSpiceTomato = {
  id: 'broth_spice_tomato',
  name: 'Spice Level for Spicy Tomato (山丹丹辣度)',
  required: false,
  options: [
    opt('No Spicy / 不要辣（山丹丹）', 0),
    opt('Tiny Spicy / 微辣（山丹丹）', 0),
    opt('Regular Spicy / 中辣（山丹丹）', 0),
    opt('Very Spicy / 重辣（山丹丹）', 0),
  ],
};
const streetCornSauce = {
  id: 'sauce',
  name: 'Sauce (酱料)',
  required: true,
  options: [opt('Butter', 0), opt('Cajun', 0)],
};
const ayceSpice = {
  id: 'spice',
  name: 'Spice Level (辣度)',
  required: true,
  options: [
    opt('Mild / 微辣', 0),
    opt('Medium Spicy / 中辣', 2),
    opt('Very Spicy / 超辣', 3),
  ],
};
const ayceOpenSpice = {
  id: 'spice',
  name: 'Spice Level (辣度)',
  required: true,
  options: [
    opt('Mild / 微辣', 0),
    opt('Very Spicy / 超辣', 3),
  ],
};
const addSnacks = {
  id: 'snacks',
  name: 'Add Snacks (小食)',
  required: false,
  options: [
    opt('Fries / 薯条', 2),
    opt('Chicken Finger / 鸡柳', 3),
    opt('Egg / 炸蛋', 2),
  ],
};
const phoOption = {
  id: 'pho_option',
  name: 'Pho Option',
  required: false,
  options: [opt('Extra Tai / 加牛肉', 2)],
};

const item = (id, name, price, modifiers = []) => ({ id, name, price, modifiers });

const menu = {
  restaurant: {
    name: 'Ming Hin Cuisine',
    address: '333 E Benton Place, Chicago, IL 60601',
    phone: '(312) 228-1333',
    tax_rate: 0.1175,
  },
  categories: [
    {
      id: 'bogo',
      name: 'BOGO Free (买一赠一)',
      items: [
        item('bogo_001', 'Napa Cabbage (上汤白菜)', 11.99),
        item('bogo_002', 'Brown Sugar Bubble Tea (招牌脏脏奶茶)', 5.50, [
          sugarLevelFull,
          toppingsBoba,
        ]),
      ],
    },
    {
      id: 'special_combo',
      name: 'Special Combo (超值套餐)',
      items: [
        item('combo_001', 'Selected For 4 (精选四人餐)', 129.00, [
          {
            id: 'combo_content',
            name: 'Combo Content (必选套餐内容)',
            required: true,
            options: [
              opt('Combo Salad (西贝大拌菜)', 0),
              opt('Mongolian Beef Bone Ribs x2 (蒙古牛大骨（牛肋骨）（2根）)', 0),
            ],
          },
        ]),
        item('combo_002', 'Combo Meal For 2 (新年双人便当套餐)', 44.99, [
          {
            id: 'combo_content',
            name: 'Combo Content (必选套餐内容)',
            required: true,
            options: [opt('Combo Salad (西贝大拌菜)', 0)],
          },
          {
            id: 'drinks_choose2',
            name: 'Drinks — Choose Two (饮料 — 任选2)',
            required: false,
            options: [
              opt('Brown Sugar Boba Milk Tea / 黑糖脏脏茶', 0.50),
              opt('Roasted Oolong Boba Milk Tea / 碳焙乌龙珍珠奶茶', 0),
              opt('Jasmine Green Boba Milk Tea / 茉香珍奶', 0),
              opt('Osmanthus Oolong Orange Fruit Tea / 桂馥柳橙水果茶', 0),
              opt('Osmanthus Oolong Grapefruit Fruit Tea / 桂馥西柚水果茶', 0),
              opt('Strawberry Milk Cloud / 草莓脏吸吸', 0),
              opt('Mango Milk Cloud / 芒果脏吸吸', 0),
            ],
          },
        ]),
        item('combo_003', 'Burger Combo (汉堡套餐)', 15.00),
      ],
    },
    {
      id: 'combo',
      name: 'Combo (组合)',
      items: [
        item('combo_004', 'Combo Street Food Meal For 4 (四人小吃套餐)', 85.99, [
          {
            id: 'drinks_choose4',
            name: 'Drinks — Choose Four (饮料 — 任选4)',
            required: false,
            options: [
              opt('Brown Sugar Boba Milk Tea / 黑糖脏脏茶', 0),
              opt('Boba Milk Tea / 珍珠奶茶', 0),
              opt('Roasted Oolong Boba Milk Tea / 碳焙乌龙珍珠奶茶', 0),
              opt('Jasmine Green Boba Milk Tea / 茉香珍奶', 0),
              opt('Osmanthus Oolong Orange Fruit Tea / 桂馥柳橙水果茶', 0),
              opt('Osmanthus Oolong Grapefruit Fruit Tea / 桂馥西柚水果茶', 0),
              opt('Strawberry Milk Cloud / 草莓脏吸吸', 0),
              opt('Mango Milk Cloud / 芒果脏吸吸', 0),
            ],
          },
        ]),
        item('combo_005', 'Combo Meal For 4 (四人便当套餐)', 79.99, [
          {
            id: 'drinks_choose4',
            name: 'Drinks — Choose Four (饮料 — 任选4)',
            required: false,
            options: [
              opt('Brown Sugar Boba Milk Tea / 黑糖脏脏茶', 0),
              opt('Boba Milk Tea / 珍珠奶茶', 0),
              opt('Roasted Oolong Boba Milk Tea / 碳焙乌龙珍珠奶茶', 0),
              opt('Jasmine Green Boba Milk Tea / 茉香珍奶', 0),
              opt('Osmanthus Oolong Orange Fruit Tea / 桂馥柳橙水果茶', 0),
              opt('Osmanthus Oolong Grapefruit Fruit Tea / 桂馥西柚水果茶', 0),
              opt('Strawberry Milk Cloud / 草莓脏吸吸', 0),
              opt('Mango Milk Cloud / 芒果脏吸吸', 0),
            ],
          },
        ]),
        item('combo_006', 'Combo Classic Meal For 2 (双人好初套餐)', 49.99, [
          {
            id: 'combo_content',
            name: 'Combo Content (必选套餐内容)',
            required: true,
            options: [opt('Mongolian Beef Bone Ribs x2 (蒙古牛大骨（牛肋骨）（2根）)', 0)],
          },
          {
            id: 'drinks_choose2',
            name: 'Drinks — Choose Two (饮料 — 任选2)',
            required: false,
            options: [
              opt('Brown Sugar Boba Milk Tea / 黑糖脏脏茶', 0.50),
              opt('Roasted Oolong Boba Milk Tea / 碳焙乌龙珍珠奶茶', 0),
              opt('Jasmine Green Boba Milk Tea / 茉香珍奶', 0),
              opt('Osmanthus Oolong Orange Fruit Tea / 桂馥柳橙水果茶', 0),
              opt('Osmanthus Oolong Grapefruit Fruit Tea / 桂馥西柚水果茶', 0),
              opt('Strawberry Milk Cloud / 草莓脏吸吸', 0),
              opt('Mango Milk Cloud / 芒果脏吸吸', 0),
            ],
          },
        ]),
        item('combo_007', 'Hot Black Tea Latte (红茶拿铁)', 10.00, [hotBlackTeaToppings]),
      ],
    },
    {
      id: 'tea_latte',
      name: 'Tea Latte (鲜奶茶)',
      items: [
        item('tea_001', 'Tsao (左宗鸡)', 4.00, [cupTypeLarge, flavorGarlic]),
      ],
    },
    {
      id: 'special_selection',
      name: 'Special Selection (甄选奶茶)',
      items: [
        item('sel_001', 'Cheese Roasted Oolong Tea (奶盖炭熔乌龙茶)', 5.50, [
          sugarLevelFull,
          toppingsBobaNoExchange,
          iceLevelBasic,
          addCheeseFoam,
        ]),
        item('sel_002', 'Cheese Jasmine Green Tea (奶盖茉莉花绿茶)', 5.50, [
          sugarLevelFull,
          toppingsBobaNoExchange,
          iceLevelBasic,
          addCheeseFoam,
        ]),
        item('sel_003', 'Peach Oolong Cheese Tea (芝士蜜桃乌龙茶)', 5.50, [
          sugarLevelFull,
          toppingsBoba,
          iceLevelBasic,
        ]),
        item('sel_004', 'Cheese High Mountain Tea (奶盖文青包种茶)', 5.50, [
          sugarLevelFull,
          toppingsBobaNoExchange,
          iceLevelBasic,
        ]),
        item('sel_005', 'High Mountain Cheese Tea (奶盖文青包种茶)', 5.50, [
          sugarLevelRegularMore,
          toppingsBoba,
          iceLevelBasic,
        ]),
        item('sel_006', 'Osmanthus Oolong Cheese Tea (奶盖桂花乌龙茶)', 5.50, [
          sugarLevelRegularMore,
          toppingsBobaNoExchange,
          iceLevelBasic,
        ]),
        item('sel_007', 'Wonderland Milk Tea — Mint w. Oreo Topping, Cold Only (梦游奶茶（冷）)', 5.99, [
          toppingsBoba,
        ]),
        item('sel_008', 'Double Black Sugar Boba Milk Tea (双倍特浓黑糖脏脏茶)', 5.95, [
          toppingsBoba,
          iceLevelHot,
          addCheeseFoamExtraOnly,
        ]),
        item('sel_009', 'High Mountain Boba Milk Tea (文青珍奶)', 6.45, [
          sugarLevelFull,
          toppingsBoba,
          iceLevelHot,
        ]),
        item('sel_010', 'Roasted Oolong Boba Milk Tea (炭焙乌龙珍奶)', 6.45, [
          sugarLevelFull,
          toppingsBoba,
          iceLevelHot,
        ]),
      ],
    },
    {
      id: 'drinks',
      name: 'Drinks (饮料)',
      items: [
        item('dr_001', 'Hot Ginger Milk (姜汁鲜奶热饮)', 8.00, [
          sugarLevelFull,
          toppingsNoMilkCap,
          iceLevelHot,
          milkUpgrade,
        ]),
        item('dr_002', 'Orange Limeade w. Chia Seeds (橙子雷梦)', 5.95, [
          sugarLevelFull,
          toppingsNoMilkCap,
          iceLevelBasic,
        ]),
        item('dr_003', 'Taro Milk Tea (芋头脏脏茶)', 5.95, [
          sugarLevelRegularMore,
          toppingsBoba,
          iceLevelBasic,
        ]),
        item('dr_004', 'Peach Milk Cloud (水蜜桃脏吸吸)', 5.95, [
          sugarLevelRegularMore,
          toppingsNoMilkCap,
          iceLevelBasic,
          milkUpgrade,
        ]),
        item('dr_005', 'Red Bean Milk Tea (红豆脏脏茶)', 5.95, [
          sugarLevelRegularMore,
          toppingsBoba,
          {
            id: 'ice',
            name: 'Ice Level (冰度)',
            required: true,
            options: [
              opt('Regular Ice / 正常冰', 0),
              opt('Less Ice / 少冰', 0),
              opt('No Ice / 去冰', 0),
            ],
          },
        ]),
        item('dr_006', 'Strawberry Milk Cloud (草莓脏吸吸)', 5.75, [
          sugarLevelRegularMore,
          toppingsNoMilkCap,
          iceLevelBasic,
          milkUpgrade,
        ]),
      ],
    },
    {
      id: 'house_special',
      name: 'House Special (本店特色)',
      items: [
        item('hs_001', 'Tsao — General Tso\'s Chicken (左宗鸡)', 4.00, [cupTypeLarge, flavorGarlic]),
        item('hs_002', 'Fried Chicken Drumstick x3 (轰炸鸡腿（3只）)', 24.00, [
          flavorGarlicPepper,
          addSauce,
        ]),
        item('hs_003', 'Fried Chicken Steak (炸香鸡排)', 1.00, [
          flavorGarlicPepper,
          addSnacks,
        ]),
        item('hs_004', 'Braised Pork Blood Cake — 2 Skewers (卤猪血糕（2串）)', 3.85),
        item('hs_005', 'Fried Chicken Wing (炸鸡翅)', 10.95, [addSauce]),
        item('hs_006', 'Fried Green Bean (椒盐四季豆)', 4.98, [addSauce]),
        item('hs_007', 'Fried Spicy Chicken Wing (香辣炸鸡翅)', 9.00),
        item('hs_008', 'Fried Tempura Ball x2 (甜不辣丸（2串）)', 4.98, [addSauce]),
        item('hs_009', 'Golden Cheese Popcorn Chicken (黄金起司咸酥鸡)', 10.00, [cheeseOption]),
        item('hs_010', 'Grilled Chicken Steak (家乡炭烤鸡排)', 9.75, [addSauce]),
        item('hs_011', 'Grilled Tofu w. Kimchi (酱烤好初泡菜豆腐)', 10.00, [addSauceNoRanch]),
        item('hs_012', 'Make Your Own Combo (自选组合)', 39.00, [spiceLevel, flavorGarlicPepper]),
        item('hs_013', 'Make Your Own Seafood Combo (海鲜自选套餐)', 39.00),
        item('hs_014', 'Popcorn Chicken (招牌盐酥鸡)', 8.95, [addSauce]),
        item('hs_015', 'Pork Feet (招财猪手)', 9.95),
        item('hs_016', 'Pork Hoofs (元宝猪手)', 14.95),
        item('hs_017', 'Scallion Pancake w. Egg (葱油饼加蛋)', 4.50),
        item('hs_018', 'Scallion Pancake w. Egg & Hot Dog (葱油饼加热狗蛋)', 5.50),
        item('hs_019', 'Smoke Chicken Bone 0.1lb (香薰鸡架 0.1lb)', 0.99),
        item('hs_020', 'Strawberry Milk Cloud (草莓脏吸吸)', 5.75, [
          sugarLevelRegularMore,
          toppingsNoMilkCap,
          iceLevelBasic,
          milkUpgrade,
        ]),
        item('hs_021', 'Tonkotsu Ramen (豚骨拉面)', 17.99),
        item('hs_022', 'Chopped Pepper Fish Head (剁椒鱼头)', 20.00, [cupTypeLargeMedium]),
        item('hs_023', 'Hot Black Tea Latte (红茶拿铁)', 10.00, [hotBlackTeaToppings]),
        item('hs_024', 'Special Chicken Over Rice (超值鸡排饭)', 20.00, [drinksJuiceCola]),
      ],
    },
    {
      id: 'side',
      name: 'Side (配菜)',
      items: [
        item('side_001', 'Fried Cuttlefish Balls — 2 Skewers (炸花枝丸（2串6粒）)', 26.26, [addSauce]),
        item('side_002', 'French Fries (椒盐脆薯)', 8.28),
        item('side_003', 'Braised Bok Choy (健康烫青菜)', 9.92),
        item('side_004', 'Fried Sausage — 3 Skewers (炸亲亲肠（3串6粒）)', 6.80, [addSauce]),
        item('side_005', 'Fried Sweet Corn — 2 Skewers (炸玉米（两串）)', 6.80, [addSauce]),
        item('side_006', 'Grilled Fish Tofu — 2 Skewers (鱼豆腐（2串）)', 10.00, [addSauceNoRanch]),
        item('side_007', 'Taiwan Style Fried Combo (台式炸物拼盘)', 25.00, [
          { id: 'sauce', name: 'Add Sauce (加酱汁)', required: false, options: [opt('HJ Spicy Sauce / HJ辣酱', 1)] },
        ]),
        item('side_008', 'Triple Chicken Drumstick (三只鸡腿组合)', 10.45),
        item('side_009', 'Fish Sticks (炸鱼条 — Side)', 11.00),
      ],
    },
    {
      id: 'cheese_steak',
      name: 'Cheese Steak (奶酪牛排)',
      items: [
        item('cs_001', 'Fish Sticks (炸鱼条 — Cheese Steak)', 10.00),
      ],
    },
    {
      id: 'lunch_bento',
      name: 'Lunch Bento (午餐便当)',
      items: [
        item('bento_001', 'Special Chicken Over Rice (超值鸡排饭 — Lunch)', 15.00, [drinksJuiceCola]),
        item('bento_002', 'Special Pork Rib Over Rice (超值排骨铁路)', 10.95, [
          { id: 'sauce', name: 'Add Sauce (加酱汁)', required: false, options: [opt('Sweet & Sour Sauce / 甜酸酱', 1)] },
        ]),
        item('bento_003', 'Taiwanese Kimchi Tofu (泡菜豆腐饭（素食）)', 8.95, [lunchCombo]),
        item('bento_004', 'Special Chicken Drumsticks Lunch Box', 10.95, [lunchCombo]),
        item('bento_005', 'Hot Black Tea Latte (红茶拿铁 — Lunch)', 10.00, [hotBlackTeaToppings]),
      ],
    },
    {
      id: 'rice_bowl',
      name: 'Rice Bowl (饭)',
      items: [
        item('rice_001', 'Special Braised Sliced Pork Belly Over Rice (超值焢肉饭)', 11.95, [lunchCombo]),
        item('rice_002', 'Kimchi Tofu Rice (泡菜豆腐饭)', 8.95),
        item('rice_003', 'Braised Sliced Pork Belly Over Rice (焢肉饭)', 9.75),
        item('rice_004', 'White Rice (白饭)', 0.99),
        item('rice_005', 'Tsao — General Tso\'s Chicken (左宗鸡 — Rice Bowl)', 4.00, [
          cupTypeLarge,
          flavorGarlic,
        ]),
      ],
    },
    {
      id: 'noodles',
      name: 'Noodles (面)',
      items: [
        item('noodle_001', 'Taiwanese Cold Noodle w. Chicken Steak (豪华鸡排凉面)', 5.00, [addSauceHjOnly]),
        item('noodle_002', 'Tsao — General Tso\'s Chicken (左宗鸡 — Noodles)', 4.00, [
          cupTypeLarge,
          flavorGarlic,
        ]),
      ],
    },
    {
      id: 'burger',
      name: 'Burger (汉堡)',
      items: [
        item('burg_001', 'HJ Signature Double Chicken Drumsticks Sandwich (招牌双层鸡腿堡)', 11.95, [
          flavorGarlicPepper,
          lunchCombo,
        ]),
        item('burg_002', 'Sandwich (汉堡)', 4.00, [flavorGarlicPepper, lunchCombo]),
        item('burg_003', 'Tsao — General Tso\'s Chicken (左宗鸡 — Burger)', 0.00, [
          cupTypeLarge,
          flavorGarlic,
        ]),
        item('burg_004', 'HJ Signature Chicken Sandwich (招牌鸡腿堡)', 9.95, [
          flavorGarlicPepper,
          lunchCombo,
        ]),
        item('burg_005', 'Special Braised Sliced Pork Belly Over Rice (超值焢肉饭 — Burger)', 10.00, [
          lunchCombo,
        ]),
      ],
    },
    {
      id: 'hot_pot',
      name: 'Hot Pot (火锅)',
      items: [
        item('hp_001', 'Double Flavors Broth Pot (鸳鸯锅)', 14.99, [
          brothOptions,
          brothSpiceTraditional,
          brothSpiceTomato,
        ]),
        item('hp_002', 'Tsao — General Tso\'s Chicken (左宗鸡 — Hot Pot)', 4.00, [
          cupTypeLarge,
          flavorGarlic,
        ]),
        item('hp_003', 'Grilled Chicken Wing (炭烤鸡翅)', 3.00),
        item('hp_004', 'Grilled Taiwanese Sausage — 2 Skewers (炭烤台式香肠（2串）)', 33.00),
      ],
    },
    {
      id: 'buffet',
      name: 'Buffet (自助餐)',
      items: [
        item('buf_001', 'Adult Lunch (成人午餐)', 9.99),
        item('buf_002', 'Adult Dinner (成人晚餐)', 15.99),
        item('buf_003', 'Kids Lunch — Ages 2-12 (儿童午餐（2-12岁）)', 5.99),
        item('buf_004', 'Kids Dinner — Ages 2-12 (儿童晚餐（2-12岁）)', 11.99),
      ],
    },
    {
      id: 'new_milk_tea',
      name: 'New Milk Tea',
      items: [
        item('nmt_001', 'Milk Tea Boba (珍珠奶茶)', 5.30, [
          sugarLevelFull,
          toppingsBoba,
          iceLevelHot,
        ]),
      ],
    },
    {
      id: 'pho',
      name: 'Phở',
      items: [
        item('pho_001', 'Pho Tai (牛肉河粉)', 15.00, [phoOption]),
      ],
    },
    {
      id: 'appetizers',
      name: 'Appetizers (前菜)',
      items: [
        item('app_001', 'Fish Sticks (炸鱼条 — Appetizer)', 8.00),
        item('app_002', 'Street Corn (烤玉米)', 10.00, [streetCornSauce, addSauce]),
      ],
    },
    {
      id: 'loyalty',
      name: 'Loyalty Points (积分专区)',
      items: [
        item('lp_001', 'Mochi Milk Tea (麻薯奶茶)', 6.66, [drinksJuiceCola]),
      ],
    },
    {
      id: 'ayce_dishes',
      name: 'AYCE Dishes (自助餐菜品)',
      items: [
        item('ayce_001', 'Dish A (菜品A)', 0.00, [ayceSpice]),
        item('ayce_002', 'Open (开价)', 0.00, [ayceOpenSpice, flavorGarlic]),
      ],
    },
  ],
};

// Deep clone to avoid shared references in modifiers
const out = JSON.parse(JSON.stringify(menu));
const outPath = path.join(__dirname, '..', 'server', 'data', 'menu.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('Wrote', outPath);
