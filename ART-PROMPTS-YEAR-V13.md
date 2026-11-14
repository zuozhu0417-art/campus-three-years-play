# v13 image generation prompts

Generator: built-in image_gen. Ten independent generation calls, not contact-sheet crops. 2026-11-15.

Common CG direction: illustration-story; original Chinese high school visual novel, 16:9 landscape, nostalgic fine pencil lines with soft watercolor, muted cream and dusty indigo, warm natural atmospheric light, gently obscured faces, natural school proportions. No text, logos or watermark; no protagonist face, suitable for either protagonist gender. Sports CG used assets/drawing-margin-cg.jpg as style reference; the others continued the established style.

| Asset | Scene prompt |
|---|---|
| year-sports.jpg | First person across a red school track; short-haired Chinese schoolboy in blue-white tracksuit offers a compact camera, another boy checks a tripod, class flag and water bottles, late October sunlight, candid friendship; lower quarter quiet. |
| year-winter.jpg | January bus stop at blue hour; Lin Yao, dark low ponytail and muted blue ribbon, cream scarf and blue-white tracksuit, stands on sheltered side near viewer with workbook; cold breath, warm bus windows, shy natural smile, softly obscured eyes. |
| year-spring.jpg | April first-person walk beside Lin Yao returning from art shop, tall kraft-paper bag at outside shoulder; long dark low ponytail, small blue ribbon, school tracksuit; plane-tree shade and local storefronts, shy turn toward viewer; no kissing or hand holding. |
| year-dinner.jpg | First person at small Chinese family dining table; mother with apron serves soup, tired father in navy shirt with job paperwork beside bowl; rice, three ordinary dishes, lamp and refrigerator note; calm complexity, no readable writing. |
| year-summer.jpg | June last day of first year; view across empty classroom toward two boys carrying last desk through door, camera wrist strap; dark-haired girl with blue ribbon waits holding books; white curtains and erased board, softly distant faces, ordinary farewell. |
| year-visitor.jpg | Corridor by small school radio room, open door, old microphone and empty visitor chair, song-selection notebook, wrapped yellow candy on sill; warm light, green lower walls, distant indistinct students, inviter not shown so both gender versions work. |

Common portrait direction: one single upper-body cutout, head to below hips, empty margin; genuine transparent alpha; nostalgic pencil and desaturated watercolor, soft cream/blue illumination, natural proportions, no glossy anime eyes, no background, no letters or watermark.

| Asset | Character prompt |
|---|---|
| qiaosui-v13.png | Chinese teenage schoolgirl Qiao Sui; shoulder-length dark hair, tiny amber barrette, lively upright posture, friendly half-smile, blue-white school zip tracksuit; holds radio notebook to chest, no makeup. |
| chenyu-v13.png | Chinese teenage schoolboy Chen Yu, slightly wavy short dark hair, open natural smile, school tracksuit, radio notebook at chest; distinct from camera friend, no celebrity likeness. |
| azhe-v13.png | Chinese teenage schoolboy A Zhe, short dark hair, relaxed slight slouch, gray-blue school tracksuit and white T-shirt, wired earphone case in hand, ordinary warm irreverent classmate. |
| father-v13.png | Chinese father mid-forties, short dark hair graying at temples, navy work shirt, gently tired face, natural stance, holds folded travel jacket at waist, no beard or glasses. |

Original tool outputs stay under Codex generated_images; deploy copies live under assets/. RGBA portraits preserve generated alpha; CG PNGs converted to quality-91 optimized JPEG without creative retouching. Manifest records source basenames and SHA-256.

Runtime portraits additionally use quality-92 WebP with lossless alpha, keeping original PNG assets. See runtime paths, hashes and bytes in manifest.
