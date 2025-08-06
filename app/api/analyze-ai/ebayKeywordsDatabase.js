/**
 * COPY THIS ENTIRE FILE TO: lib/ebayKeywordsDatabase.js
 */

class EbayKeywordsDatabase {
  constructor() {
    this.keywords = {
      
      trousers: {
        fits: ['Skinny', 'Straight', 'Bootcut', 'Wide Leg', 'Flare', 'Tapered', 'Balloon', 'Baggy', 'Relaxed', 'Slim Fit'],
        waist: ['High Waisted', 'Low Rise', 'Mid Rise', 'High Rise'],
        length: ['Ankle', 'Cropped', 'Full Length', 'Capri', 'Pedal Pushers'],
        features: ['Stretch', 'Elasticated', 'Drawstring', 'Cargo Pockets', 'Side Pockets', 'Zip Pockets'],
        style: ['Smart', 'Casual', 'Work', 'Formal', 'Pleated', 'Pressed', 'Tailored'],
        leg_shapes: ['Bell Bottom', 'Cigarette', 'Palazzo', 'Joggers', 'Track', 'Leggings']
      },

      jeans: {
        fits: ['Skinny', 'Straight', 'Bootcut', 'Wide Leg', 'Boyfriend', 'Mom', 'Dad', 'Flare', 'Bell Bottom'],
        waist: ['High Waisted', 'Low Rise', 'Mid Rise'],
        features: ['Ripped', 'Distressed', 'Raw Hem', 'Turn Up', 'Cuffed', 'Stretch', 'Non Stretch'],
        style: ['Vintage', 'Retro', 'Classic', 'Modern', 'Acid Wash', 'Stone Wash', 'Dark Wash', 'Light Wash']
      },

      dresses: {
        length: ['Mini', 'Midi', 'Maxi', 'Knee Length', 'Tea Length', 'Floor Length', 'Asymmetric', 'Hi Low'],
        necklines: ['V Neck', 'Scoop Neck', 'High Neck', 'Cowl Neck', 'Off Shoulder', 'One Shoulder', 'Halter', 'Strapless', 'Square Neck'],
        sleeves: ['Sleeveless', 'Cap Sleeve', 'Short Sleeve', 'Long Sleeve', 'Bell Sleeve', 'Puff Sleeve', 'Batwing', 'Cold Shoulder'],
        silhouettes: ['A Line', 'Bodycon', 'Shift', 'Wrap', 'Fit Flare', 'Empire', 'Sheath', 'Swing', 'Skater', 'Pencil'],
        features: ['Pockets', 'Side Pockets', 'Zip Back', 'Button Front', 'Tie Waist', 'Belted', 'Ruched', 'Pleated', 'Tiered'],
        occasions: ['Casual', 'Party', 'Evening', 'Wedding Guest', 'Work', 'Summer', 'Beach', 'Holiday'],
        styles: ['Vintage', 'Retro', 'Boho', 'Festival', 'Minimalist', 'Smart']
      },

      tops: {
        types: ['Blouse', 'Shirt', 'Cami', 'Tank', 'Vest', 'Tee', 'Tunic', 'Smock', 'Peplum'],
        necklines: ['V Neck', 'Scoop Neck', 'Crew Neck', 'High Neck', 'Turtle Neck', 'Cowl Neck', 'Off Shoulder', 'Cold Shoulder', 'Boat Neck'],
        sleeves: ['Sleeveless', 'Cap Sleeve', 'Short Sleeve', 'Long Sleeve', 'Bell Sleeve', 'Puff Sleeve', 'Bishop Sleeve', 'Raglan', 'Batwing'],
        fits: ['Fitted', 'Loose', 'Oversized', 'Cropped', 'Boxy', 'Flowy', 'Tailored', 'Relaxed'],
        features: ['Button Up', 'Zip Front', 'Tie Front', 'Wrap', 'Asymmetric', 'Keyhole', 'Cut Out', 'Lace Up', 'Mesh Insert'],
        styles: ['Casual', 'Smart', 'Work', 'Evening', 'Minimalist']
      },

      jumpers: {
        types: ['Jumper', 'Sweater', 'Cardigan', 'Pullover', 'Hoodie', 'Sweatshirt', 'Knit', 'Aran', 'Cable Knit'],
        necklines: ['Crew Neck', 'V Neck', 'Turtle Neck', 'Roll Neck', 'Cowl Neck', 'Hooded', 'Zip Neck'],
        fits: ['Fitted', 'Oversized', 'Chunky', 'Fine Knit', 'Loose', 'Cropped', 'Longline'],
        features: ['Cable', 'Ribbed', 'Textured', 'Fair Isle', 'Nordic', 'Zip Up', 'Button Up', 'Pockets'],
        weights: ['Lightweight', 'Medium Weight', 'Chunky', 'Heavy', 'Fine Gauge', 'Thick Knit'],
        styles: ['Vintage', 'Classic', 'Modern', 'Casual', 'Smart']
      },

      skirts: {
        length: ['Mini', 'Midi', 'Maxi', 'Knee Length', 'Tea Length'],
        silhouettes: ['A Line', 'Pencil', 'Circle', 'Pleated', 'Tiered', 'Asymmetric', 'Wrap', 'Tube', 'Flare'],
        waist: ['High Waisted', 'Low Rise', 'Mid Rise'],
        features: ['Side Split', 'Front Split', 'Back Split', 'Pockets', 'Zip Back', 'Button Front', 'Elastic Waist'],
        styles: ['Smart', 'Casual', 'Work', 'Party', 'Vintage', 'Minimalist']
      },

      jackets: {
        types: ['Blazer', 'Bomber', 'Denim', 'Leather', 'Biker', 'Military', 'Parka', 'Trench', 'Puffer', 'Quilted'],
        fits: ['Fitted', 'Oversized', 'Cropped', 'Longline', 'Regular'],
        features: ['Zip Up', 'Button Up', 'Hood', 'Pockets', 'Belt', 'Fur Trim', 'Removable Hood', 'Waterproof'],
        styles: ['Smart', 'Casual', 'Work', 'Vintage', 'Military', 'Biker']
      },

      general_styles: {
        eras: ['Vintage', 'Retro', '70s', '80s', '90s', 'Y2K'],
        vibes: ['Boho', 'Festival', 'Minimalist', 'Smart', 'Casual'],
        occasions: ['Casual', 'Smart', 'Work', 'Party', 'Evening', 'Holiday', 'Summer'],
        fits: ['Oversized', 'Fitted', 'Loose', 'Relaxed', 'Tailored', 'Slim', 'Regular']
      }
    };
  }

  getKeywords(itemType, subCategory = null, maxKeywords = 3) {
    const normalizedItem = itemType.toLowerCase();
    let relevantKeywords = [];

    const itemMapping = {
      'dress': 'dresses',
      'jumper': 'jumpers', 
      'sweater': 'jumpers',
      'cardigan': 'jumpers',
      'jeans': 'jeans',
      'trousers': 'trousers',
      'pants': 'trousers',
      'top': 'tops',
      'shirt': 'tops',
      'blouse': 'tops',
      'skirt': 'skirts',
      'jacket': 'jackets',
      'coat': 'jackets'
    };

    const mappedItem = itemMapping[normalizedItem] || normalizedItem;
    
    if (this.keywords[mappedItem]) {
      const itemKeywords = this.keywords[mappedItem];
      
      Object.values(itemKeywords).forEach(keywordArray => {
        relevantKeywords = relevantKeywords.concat(keywordArray);
      });
    }

    relevantKeywords = [...new Set(relevantKeywords)];
    relevantKeywords = this.shuffleArray(relevantKeywords);

    return relevantKeywords.slice(0, maxKeywords);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export { EbayKeywordsDatabase };