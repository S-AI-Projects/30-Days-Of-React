// Independent reference state transition table
export const REFERENCE_TABLE = [
  {
    step: 1,
    action: 'initial_render',
    clickTarget: null,
    expectedSelectedId: null,
    expectedDetailVisible: false,
    expectedEmptyVisible: true,
    expectedTitle: '',
    expectedContent: ''
  },
  {
    step: 2,
    action: 'select_record_a',
    clickTarget: 'btn-select-rec-a',
    expectedSelectedId: 'rec-a',
    expectedDetailVisible: true,
    expectedEmptyVisible: false,
    expectedTitle: 'Record Alpha',
    expectedContent: 'Details for record Alpha.'
  },
  {
    step: 3,
    action: 'select_record_b',
    clickTarget: 'btn-select-rec-b',
    expectedSelectedId: 'rec-b',
    expectedDetailVisible: true,
    expectedEmptyVisible: false,
    expectedTitle: 'Record Beta',
    expectedContent: 'Details for record Beta.'
  },
  {
    step: 4,
    action: 'clear_selection',
    clickTarget: 'btn-clear-selection',
    expectedSelectedId: null,
    expectedDetailVisible: false,
    expectedEmptyVisible: true,
    expectedTitle: '',
    expectedContent: ''
  }
];
