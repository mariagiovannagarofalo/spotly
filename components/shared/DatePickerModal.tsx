import { useEffect, useState } from 'react'
import { Dimensions, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import i18n from '../../lib/i18n'
import { colors, font, radii, spacing } from '../../lib/theme'

type Props = {
  visible: boolean
  value: string | null
  onSelect: (iso: string) => void
  onClose: () => void
}

const CARD_WIDTH = Math.min(Dimensions.get('window').width - 48, 340)
const CELL_SIZE = (CARD_WIDTH - spacing.md * 2) / 7

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getWeeks(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export default function DatePickerModal({ visible, value, onSelect, onClose }: Props) {
  const today = new Date()
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate())

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  useEffect(() => {
    if (visible) {
      if (value) {
        const d = new Date(value + 'T12:00:00')
        setYear(d.getFullYear())
        setMonth(d.getMonth())
      } else {
        setYear(today.getFullYear())
        setMonth(today.getMonth())
      }
    }
  }, [visible])

  const months = i18n.t('months') as unknown as string[]
  const daysShort = i18n.t('days_short') as unknown as string[]
  const weeks = getWeeks(year, month)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.card} onPress={e => e.stopPropagation()}>

          <View style={s.nav}>
            <TouchableOpacity onPress={prevMonth} style={s.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={s.monthTitle}>{months[month]} {year}</Text>
            <TouchableOpacity onPress={nextMonth} style={s.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={s.daysRow}>
            {daysShort.map(d => (
              <Text key={d} style={s.dayLabel}>{d}</Text>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={s.weekRow}>
              {week.map((day, di) => {
                if (!day) return <View key={`e-${wi}-${di}`} style={s.cell} />
                const iso = toISO(year, month, day)
                const isSelected = iso === value
                const isToday = iso === todayISO
                return (
                  <TouchableOpacity
                    key={iso}
                    style={s.cell}
                    onPress={() => { onSelect(iso); onClose() }}
                  >
                    <View style={[
                      s.dayCircle,
                      isSelected && s.selectedCircle,
                      isToday && !isSelected && s.todayCircle,
                    ]}>
                      <Text style={[
                        s.dayText,
                        isSelected && s.selectedText,
                        isToday && !isSelected && s.todayText,
                      ]}>
                        {day}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          ))}

          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnText}>{i18n.t('common.close')}</Text>
          </TouchableOpacity>

        </Pressable>
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  navBtn: { padding: spacing.xs },
  navArrow: { color: colors.white, fontSize: 28, fontWeight: '300' },
  monthTitle: { color: colors.white, ...font.heading },
  daysRow: { flexDirection: 'row', marginBottom: spacing.xs },
  dayLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    color: colors.textDim,
    ...font.small,
  },
  weekRow: { flexDirection: 'row' },
  cell: {
    width: CELL_SIZE,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: { backgroundColor: colors.primary },
  todayCircle: { borderWidth: 1, borderColor: colors.primary },
  dayText: { color: colors.white, ...font.label },
  selectedText: { color: colors.white, fontWeight: '700' },
  todayText: { color: colors.primary },
  closeBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  closeBtnText: { color: colors.textDim, ...font.label },
})
