import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data para exibição
 */
export function formatDate(
  date: string | Date,
  formatStr: string = 'dd/MM/yyyy'
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Data inválida';
    return format(dateObj, formatStr, { locale: ptBR });
  } catch {
    return 'Data inválida';
  }
}

/**
 * Formata uma data para exibição relativa (ex: "há 2 horas")
 */
export function formatRelativeDate(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Data inválida';
    return formatDistanceToNow(dateObj, { 
      addSuffix: true, 
      locale: ptBR 
    });
  } catch {
    return 'Data inválida';
  }
}

/**
 * Formata uma data e hora completa
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy \'às\' HH:mm');
}

/**
 * Verifica se uma data é hoje
 */
export function isToday(date: string | Date): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const today = new Date();
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
}

/**
 * Obtém o início do dia para uma data
 */
export function startOfDay(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const result = new Date(dateObj);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Obtém o fim do dia para uma data
 */
export function endOfDay(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const result = new Date(dateObj);
  result.setHours(23, 59, 59, 999);
  return result;
}