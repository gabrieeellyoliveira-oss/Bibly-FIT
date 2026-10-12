const ex = (name, sets, reps, rest = '60s') => ({
  id: Math.random().toString(36).slice(2, 10),
  name,
  sets,
  reps,
  rest,
})

export const seedWorkouts = () => [
  {
    id: 'A',
    name: 'Queima & Pernas',
    focus: 'Inferiores',
    duration: '45–60 min',
    exercises: [
      ex('Agachamento livre', 4, '10', '90s'),
      ex('Leg press 45°', 4, '12', '90s'),
      ex('Cadeira extensora', 3, '15'),
      ex('Stiff com halteres', 4, '10', '90s'),
      ex('Mesa flexora', 3, '12'),
      ex('Passada (afundo)', 3, '10 cada perna'),
      ex('Elevação pélvica', 4, '12'),
      ex('Panturrilha em pé', 4, '15', '45s'),
    ],
  },
  {
    id: 'B',
    name: 'Define & Tonifica',
    focus: 'Superiores',
    duration: '40–50 min',
    exercises: [
      ex('Supino com halteres', 3, '12'),
      ex('Puxada frontal', 3, '12'),
      ex('Remada baixa', 3, '12'),
      ex('Desenvolvimento com halteres', 3, '10'),
      ex('Elevação lateral', 3, '15', '45s'),
      ex('Rosca direta', 3, '12', '45s'),
      ex('Tríceps na corda', 3, '12', '45s'),
    ],
  },
  {
    id: 'C',
    name: 'Glúteo & Barriga Chapada',
    focus: 'Glúteos & core',
    duration: '45–55 min',
    exercises: [
      ex('Elevação pélvica com barra', 4, '10', '90s'),
      ex('Abdução na máquina', 4, '15'),
      ex('Coice na polia', 3, '12 cada perna'),
      ex('Agachamento búlgaro', 3, '10 cada perna', '90s'),
      ex('Prancha', 3, '40s', '45s'),
      ex('Abdominal infra', 3, '15', '45s'),
      ex('Perdigueiro (bird dog)', 3, '12 cada lado', '45s'),
    ],
  },
]

// Nomes atuais dos treinos sugeridos (os antigos eram "Treino A/B/C")
export const WORKOUT_NAMES = { A: 'Queima & Pernas', B: 'Define & Tonifica', C: 'Glúteo & Barriga Chapada' }

// Capas dos treinos sugeridos (public/exercicios/<slug>.webp)
export const WORKOUT_COVERS = { A: 'capa-queima-pernas', B: 'capa-define-tonifica', C: 'capa-gluteo-barriga' }
