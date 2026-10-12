import { WORKOUT_COVERS, WORKOUT_NAMES } from './seed'

// Ilustrações dos exercícios (public/exercicios/<slug>.webp e <slug>-thumb.webp).
// A imagem é escolhida pelo nome do exercício, então vale também para treinos já salvos.
// A ordem importa: regras mais específicas primeiro.
const RULES = [
  [/hip thrust|elevacao pelvica com barra/, 'gluteo-hip-thrust-banco'],
  [/elevacao pelvica|ponte de gluteo/, 'gluteo-elevacao-pelvica-barra'],
  [/leg press/, 'pernas-leg-press-45'],
  [/extensora|extensao de pernas/, 'pernas-cadeira-extensora'],
  [/stiff|terra romeno/, 'pernas-stiff-halteres'],
  [/mesa flexora|leg curl/, 'pernas-mesa-flexora'],
  [/passada|afundo/, 'pernas-afundo-halteres'],
  [/^agachamento( livre| com barra)?$/, 'pernas-agachamento-livre'],
  [/panturrilha/, 'pernas-panturrilha-em-pe-maquina'],
  [/supino/, 'peito-supino-reto-halteres'],
  [/puxada/, 'costas-puxada-frontal'],
  [/remada baixa|remada sentada/, 'costas-remada-baixa'],
  [/desenvolvimento/, 'ombro-desenvolvimento-halteres'],
  [/elevacao lateral/, 'ombro-elevacao-lateral-halteres'],
  [/rosca/, 'biceps-rosca-direta-halteres'],
  [/triceps/, 'triceps-corda'],
  [/abducao/, 'gluteo-abducao-maquina'],
  [/coice|kickback/, 'gluteo-coice-polia'],
  [/bulgaro/, 'pernas-agachamento-bulgaro'],
  [/prancha/, 'core-prancha'],
  [/perdigueiro|bird dog/, 'core-perdigueiro'],
  [/abdominal infra|elevacao de pernas|power tower|cadeira do capitao/, 'core-abdominal-infra'],
  [/abdominal|crunch/, 'core-abdominal'],
  [/esteira|corrida|caminhada/, 'cardio-esteira'],
  [/escada|stair/, 'cardio-escada'],
  [/bicicleta|bike|ergometrica/, 'cardio-bicicleta'],
]

const normalize = (s = '') =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export function exerciseSlug(exercise) {
  if (exercise?.image) return exercise.image
  const name = normalize(exercise?.name)
  return RULES.find(([re]) => re.test(name))?.[1] ?? null
}

export const imageUrl = (slug, thumb = false) => (slug ? `/exercicios/${slug}${thumb ? '-thumb' : ''}.webp` : null)

// Imagem de capa do treino: a escolhida no treino, a capa própria dos treinos sugeridos
// ou a do primeiro exercício com ilustração
export function workoutCover(workout) {
  if (workout?.image) return workout.image
  if (WORKOUT_COVERS[workout?.id] && workout.name === WORKOUT_NAMES[workout.id]) return WORKOUT_COVERS[workout.id]
  for (const e of workout?.exercises || []) {
    const slug = exerciseSlug(e)
    if (slug) return slug
  }
  return null
}
