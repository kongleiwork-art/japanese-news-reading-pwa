#!/bin/bash

# 轻读日语 - 图片生成脚本
# 使用 AI API 生成小红书推广图片

echo "🎨 开始生成轻读日语推广图片..."
echo ""

# 设置API URL
API_URL="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image"

# 图片目录
IMG_DIR="/workspace/marketing/images"
mkdir -p "$IMG_DIR"

# 定义图片
declare -A IMAGES=(
    ["1-app-interface"]="A beautiful iPhone mockup showing a Japanese learning app interface with warm cream beige tones. The screen displays Japanese news article cards with elegant typography. Soft watercolor-style cherry blossom decorations in corners. Clean minimalist Japanese aesthetic. Professional product photography style with soft natural lighting. The design feels cozy sophisticated and inviting. Include subtle shadows and depth for 3D effect. Warm golden hour lighting. White marble desk surface background."
    
    ["2-vocab-card"]="A beautifully designed Japanese vocabulary flashcard modal on a cream background. Large Japanese kanji character displayed prominently in elegant serif font. Below shows hiragana reading and Chinese meanings. AI explanation section with sparkle icon. Soft pastel color palette with warm undertones. Clean modern Japanese UI design similar to premium language apps. Professional flat illustration style with subtle gradients and soft shadows. Warm lighting. Centered composition. White and cream background."
    
    ["3-lifestyle"]="A young Asian woman in her 20s studying Japanese on her phone at a cozy Japanese-style cafe. Warm afternoon sunlight streaming through windows. Soft bokeh background with potted plants. A latte with latte art beside her. She has a focused but relaxed expression. Casual trendy clothes. Phone screen shows elegant Japanese text. Film grain effect. Warm golden hour tones. Lifestyle photography style. Aspirational and relatable. Natural lighting. Candid moment feeling. Shot on iPhone aesthetic."
    
    ["4-wordbook"]="A beautifully organized Japanese vocabulary notebook interface on a white cream background. Shows multiple collapsible word group cards with Japanese newspaper article titles as headers. Each word card displays large kanji vocabulary with colored level tags. Soft shadows create depth. Clean modern UI design with Japanese aesthetics. Includes review count badges and date stamps. Premium language learning app feel. Professional UI mockup style. Flat design with subtle gradients. Warm white background. Studio lighting."
    
    ["5-comparison"]="A split comparison image: Left side shows traditional Japanese study method - cluttered desk with textbooks, boring vocabulary notebooks, a frustrated young woman frowning at books. Right side shows modern app-based learning - the same woman happily reading on her phone at a stylish cafe with coffee and natural light. Center has a curved arrow transforming from frustrated to happy expression. High contrast between dark dull left and bright warm right. Modern flat illustration style with bold colors. Clear visual storytelling. Inspirational mood. Digital art style. Warm color palette on right side."
)

declare -A SIZES=(
    ["1-app-interface"]="landscape_4_3"
    ["2-vocab-card"]="portrait_4_3"
    ["3-lifestyle"]="portrait_4_3"
    ["4-wordbook"]="portrait_4_3"
    ["5-comparison"]="portrait_4_3"
)

# 生成每张图片
for key in "${!IMAGES[@]}"; do
    echo "📸 生成图片: $key"
    
    # URL编码prompt
    PROMPT=$(echo "${IMAGES[$key]}" | sed 's/ /%20/g' | sed 's/\"/%22/g' | sed 's/&/%26/g')
    SIZE="${SIZES[$key]}"
    
    # 构建完整URL
    FULL_URL="${API_URL}?prompt=${PROMPT}&image_size=${SIZE}"
    
    echo "   URL: ${FULL_URL:0:100}..."
    echo "   保存到: ${IMG_DIR}/${key}.png"
    echo ""
done

echo "✅ 图片生成指令已准备完成！"
echo ""
echo "📝 使用方法："
echo "1. 在浏览器中打开 HTML 文件"
echo "2. 图片会自动通过 AI API 加载"
echo ""
echo "🎯 或者直接复制以下 URL 到浏览器查看图片："
echo ""
echo "1. App界面展示："
echo "${API_URL}?prompt=A%20beautiful%20iPhone%20mockup%20showing%20a%20Japanese%20learning%20app%20interface%20with%20warm%20cream%20beige%20tones.%20The%20screen%20displays%20Japanese%20news%20article%20cards%20with%20elegant%20typography.%20Soft%20watercolor-style%20cherry%20blossom%20decorations%20in%20corners.%20Clean%20minimalist%20Japanese%20aesthetic.%20Professional%20product%20photography%20style%20with%20soft%20natural%20lighting.%20The%20design%20feels%20cozy%20sophisticated%20and%20inviting.%20Include%20subtle%20shadows%20and%20depth%20for%203D%20effect.%20Warm%20golden%20hour%20lighting.%20White%20marble%20desk%20surface%20background.&image_size=landscape_4_3"
