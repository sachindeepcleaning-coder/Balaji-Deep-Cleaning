// Shared helpers for a submit the SITE refuses.
//
// A refused submit must do two things:
//   1. move the focus back into the form, so the visitor can fix the field
//      that is wrong, and
//   2. tell click-guard, so it can UNDO the conversion it recorded for this
//      submit — a submit the site refused never produced a lead, so it must
//      not create an owner alert email or a CRM card.
//
// The blur() inside focusField is NOT cosmetic: focus() on the element that
// is already focused fires no focusin event, and the click-guard beacon
// (v12) tells a refused submit from a good one by exactly that event — the
// focus jumping back into the form it just rejected. A React form never
// moves the focus by itself, so without this the owner's "Form submitted"
// alert and a phantom CRM card were created for a submit the site refused.
//
// The direct channel (window.cgFormRejected, beacon v13) is a no-op until
// that rollout happens, so both paths can coexist today.

// Move the focus back to the field the visitor has to fix.
export function focusField(el) {
  if (!el || typeof el.focus !== 'function') return;
  try {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (typeof document !== 'undefined' && document.activeElement === el) el.blur();
    el.focus({ preventScroll: true });
    if (start !== null && start !== undefined && typeof el.setSelectionRange === 'function') {
      try { el.setSelectionRange(start, end); } catch (_) {}
    }
  } catch (_) {}
}

// Tell click-guard that the site refused this submit, so it can undo the
// conversion it recorded (no lead exists -> no alert email, no CRM card).
export function notifyRejected() {
  try {
    if (typeof window !== 'undefined' && typeof window.cgFormRejected === 'function') {
      window.cgFormRejected();
    }
  } catch (_) {}
}
