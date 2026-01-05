/**
 * Gerador de projeto CapCut (draft_content.json)
 * Estrutura compatível com CapCut Desktop
 */

// Gerar ID único estilo CapCut
const generateId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Converter segundos para microssegundos (CapCut usa microssegundos)
const secondsToMicroseconds = (seconds: number): number => Math.round(seconds * 1_000_000);

interface SceneData {
  number: number;
  fileName: string;
  durationSeconds: number;
  startSeconds: number;
  text?: string;
}

// Criar segmento de vídeo/imagem
const createVideoSegment = (
  materialId: string,
  segmentId: string,
  durationMicro: number,
  startMicro: number
) => ({
  cartoon: false,
  clip: {
    alpha: 1.0,
    flip: { horizontal: false, vertical: false },
    rotation: 0.0,
    scale: { x: 1.0, y: 1.0 },
    transform: { x: 0.0, y: 0.0 }
  },
  common_keyframes: [],
  enable_adjust: true,
  enable_color_curves: true,
  enable_color_match_adjust: false,
  enable_color_wheels: true,
  enable_lut: true,
  enable_smart_color_adjust: false,
  extra_material_refs: [],
  group_id: "",
  hdr_settings: { intensity: 1.0, mode: 1, nits: 1000 },
  id: segmentId,
  intensifies_audio: false,
  is_placeholder: false,
  is_tone_modify: false,
  keyframe_refs: [],
  last_nonzero_volume: 1.0,
  material_id: materialId,
  render_index: 0,
  responsive_layout: {
    enable: false,
    horizontal_pos_layout: 0,
    size_layout: 0,
    target_follow: "",
    vertical_pos_layout: 0
  },
  reverse: false,
  source_timerange: { duration: durationMicro, start: 0 },
  speed: 1.0,
  target_timerange: { duration: durationMicro, start: startMicro },
  template_id: "",
  template_scene: "default",
  track_attribute: 0,
  track_render_index: 0,
  uniform_scale: { on: true, value: 1.0 },
  visible: true,
  volume: 1.0
});

// Criar material de vídeo/imagem
const createVideoMaterial = (
  id: string,
  fileName: string,
  durationMicro: number,
  width = 1920,
  height = 1080
) => ({
  aigc_type: "none",
  audio_fade: null,
  cartoon_path: "",
  category_id: "",
  category_name: "local",
  check_flag: 63487,
  crop: {
    lower_left_x: 0.0,
    lower_left_y: 1.0,
    lower_right_x: 1.0,
    lower_right_y: 1.0,
    upper_left_x: 0.0,
    upper_left_y: 0.0,
    upper_right_x: 1.0,
    upper_right_y: 0.0
  },
  crop_ratio: "free",
  crop_scale: 1.0,
  duration: durationMicro,
  extra_type_option: 0,
  formula_id: "",
  freeze: null,
  gameplay: null,
  has_audio: false,
  height: height,
  id: id,
  intensifies_audio_path: "",
  intensifies_path: "",
  is_ai_generate_content: false,
  is_unified_beauty_mode: false,
  local_id: "",
  local_material_id: generateId(),
  material_id: id,
  material_name: fileName,
  material_url: "",
  matting: {
    flag: 0,
    has_use_quick_brush: false,
    has_use_quick_eraser: false,
    interactiveTime: [],
    path: "",
    strokes: []
  },
  media_path: "",
  object_locked: null,
  origin_material_id: "",
  path: `Resources/${fileName}`, // Path relativo à pasta Resources do projeto
  picture_from: "none",
  picture_set_category_id: "",
  picture_set_category_name: "",
  request_id: "",
  reverse_intensifies_path: "",
  reverse_path: "",
  smart_motion: null,
  source: 0,
  source_platform: 0,
  stable: {
    matrix_path: "",
    stable_level: 0,
    time_range: { duration: 0, start: 0 }
  },
  team_id: "",
  type: "photo",
  video_algorithm: {
    algorithms: [],
    deflicker: null,
    motion_blur_config: null,
    noise_reduction: null,
    path: "",
    quality_enhance: null,
    time_range: null
  },
  width: width
});

// Criar track de vídeo
const createVideoTrack = (trackId: string, segments: any[]) => ({
  attribute: 0,
  flag: 0,
  id: trackId,
  is_default_name: true,
  name: "",
  segments: segments,
  type: "video"
});

// Criar canvas (fundo)
const createCanvas = (id: string) => ({
  album_image: "",
  blur: 0.0,
  color: "",
  id: id,
  image: "",
  image_id: "",
  image_name: "",
  source_platform: 0,
  team_id: "",
  type: "canvas_color"
});

// Criar speed material
const createSpeed = (id: string) => ({
  curve_speed: null,
  id: id,
  mode: 0,
  speed: 1.0,
  type: "speed"
});

/**
 * Gerar o draft_content.json completo para CapCut
 */
export const generateCapcutDraftContent = (
  scenes: SceneData[],
  projectName = "Projeto Gerado"
): string => {
  const now = Date.now();
  const trackId = generateId();
  const canvasId = generateId();
  
  // Criar materials e segments para cada cena
  const videoMaterials: any[] = [];
  const segments: any[] = [];
  const speeds: any[] = [];
  
  let currentStartMicro = 0;
  
  scenes.forEach((scene) => {
    const materialId = generateId();
    const segmentId = generateId();
    const speedId = generateId();
    const durationMicro = secondsToMicroseconds(scene.durationSeconds);
    
    // Material
    videoMaterials.push(createVideoMaterial(
      materialId,
      scene.fileName,
      durationMicro
    ));
    
    // Segment
    segments.push(createVideoSegment(
      materialId,
      segmentId,
      durationMicro,
      currentStartMicro
    ));
    
    // Speed
    speeds.push(createSpeed(speedId));
    
    currentStartMicro += durationMicro;
  });

  // Calcular duração total
  const totalDurationMicro = currentStartMicro;

  // Estrutura completa do draft_content.json
  const draftContent = {
    canvas_config: {
      height: 1080,
      ratio: "16:9",
      width: 1920
    },
    color_space: 0,
    config: {
      adjust_max_index: 1,
      attachment_info: [],
      combination_max_index: 1,
      export_range: null,
      lyrics_recognition_id: "",
      lyrics_sync: true,
      lyrics_taskinfo: [],
      maintrack_adsorb: true,
      material_save_mode: 0,
      multi_language_current: "none",
      multi_language_list: [],
      multi_language_main: "none",
      multi_language_mode: "none",
      original_sound_last_index: 0,
      record_audio_last_index: 0,
      sticker_max_index: 1,
      subtitle_keywords_color: null,
      subtitle_recognition_id: "",
      subtitle_sync: true,
      subtitle_taskinfo: [],
      system_font_list: [],
      video_mute: false,
      zoom_info_state: false
    },
    cover: "",
    create_time: now,
    duration: totalDurationMicro,
    extra_info: "",
    fps: 30.0,
    free_render_index_mode_on: false,
    group_container: null,
    id: generateId(),
    keyframe_graph_list: [],
    keyframes: {
      adjusts: [],
      audios: [],
      effects: [],
      filters: [],
      handwrites: [],
      stickers: [],
      texts: [],
      videos: []
    },
    last_modified_platform: {
      app_id: 3704,
      app_source: "pc",
      app_version: "4.0.0",
      device_id: generateId(),
      hard_disk_id: generateId(),
      mac_address: generateId(),
      os: "windows",
      os_version: "10.0"
    },
    materials: {
      adjusts: [],
      audio_balances: [],
      audio_effects: [],
      audio_fades: [],
      audio_track_indexes: [],
      audios: [],
      beats: [],
      canvases: [createCanvas(canvasId)],
      chromas: [],
      color_curves: [],
      digital_humans: [],
      drafts: [],
      effects: [],
      flowers: [],
      green_screens: [],
      handwrites: [],
      hsl: [],
      images: [],
      log_color_wheels: [],
      loudnesses: [],
      manual_deformations: [],
      masks: [],
      material_animations: [],
      material_colors: [],
      multi_language_refs: [],
      placeholders: [],
      plugin_effects: [],
      primary_color_wheels: [],
      realtime_denoises: [],
      shape_masks: [],
      smart_crops: [],
      smart_relights: [],
      sound_channel_mappings: [],
      speeds: speeds,
      stickers: [],
      tail_leaders: [],
      text_templates: [],
      texts: [],
      time_marks: [],
      transitions: [],
      video_effects: [],
      video_trackings: [],
      videos: videoMaterials,
      vocal_separations: []
    },
    mutable_config: null,
    name: projectName,
    new_version: "116.0.0",
    platform: {
      app_id: 3704,
      app_source: "pc",
      app_version: "4.0.0",
      device_id: generateId(),
      hard_disk_id: generateId(),
      mac_address: generateId(),
      os: "windows",
      os_version: "10.0"
    },
    relationships: [],
    render_index_track_mode_on: false,
    retouch_cover: null,
    source: "default",
    static_cover_image_path: "",
    tracks: [createVideoTrack(trackId, segments)],
    update_time: now,
    version: 360000
  };

  return JSON.stringify(draftContent, null, 2);
};

/**
 * Gerar o draft_meta_info.json (metadados do projeto)
 */
export const generateCapcutDraftMetaInfo = (
  scenes: SceneData[],
  projectName = "Projeto Gerado"
): string => {
  const now = Date.now();
  const nowSeconds = Math.floor(now / 1000);
  
  // Calcular duração total
  const totalDurationMicro = scenes.reduce(
    (acc, scene) => acc + secondsToMicroseconds(scene.durationSeconds),
    0
  );

  // Criar lista de materiais importados
  const draftMaterials = scenes.map((scene) => ({
    create_time: nowSeconds,
    duration: secondsToMicroseconds(scene.durationSeconds),
    extra_info: "",
    file_Path: `Resources/${scene.fileName}`,
    height: 1080,
    id: generateId(),
    import_time: nowSeconds,
    import_time_ms: now,
    item_source: 1,
    md5: "",
    metetype: "photo",
    roughcut_time_range: { duration: -1, start: -1 },
    sub_time_range: { duration: -1, start: -1 },
    type: 0,
    width: 1920
  }));

  const metaInfo = {
    all_imported_media_resource_start_timecode: null,
    draft_cloud_capcut_purchase_info: null,
    draft_cloud_complain_id: "",
    draft_cloud_last_action_download: false,
    draft_cloud_materials: [],
    draft_cloud_purchase_info: null,
    draft_cloud_template_id: "",
    draft_cloud_tutorial_info: null,
    draft_cloud_videocut_purchase_info: null,
    draft_cover: "",
    draft_deeplink_url: "",
    draft_fold_path: "",
    draft_id: generateId(),
    draft_is_ai_packaging_used: false,
    draft_is_ai_shorts: false,
    draft_is_ai_translate: false,
    draft_is_article_video_draft: false,
    draft_is_from_deeplink: "false",
    draft_is_invisible: false,
    draft_materials: draftMaterials,
    draft_materials_copied_info: [],
    draft_name: projectName,
    draft_new_version: "",
    draft_removable_storage_device: "",
    draft_root_path: "",
    draft_segment_extra_info: null,
    draft_timeline_materials_size_: 0,
    tm_draft_cloud_completed: "",
    tm_draft_cloud_modified: "",
    tm_draft_create: nowSeconds,
    tm_draft_modified: nowSeconds,
    tm_duration: totalDurationMicro
  };

  return JSON.stringify(metaInfo, null, 2);
};
