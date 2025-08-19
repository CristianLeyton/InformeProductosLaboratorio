window.addEventListener('DOMContentLoaded', async () => {
  const inputLaboratorio = document.getElementById('inputLaboratorio');
  const sugerenciasLaboratorio = document.getElementById('sugerenciasLaboratorio');
  const btnAgregarLab = document.getElementById('btnAgregarLab');
  const btnLimpiarLabs = document.getElementById('btnLimpiarLabs');
  const chipsLabs = document.getElementById('labsSeleccionados');
  const columnasOpciones = document.getElementById('columnasOpciones');
  const btnGenerar = document.getElementById('btnGenerar');
  const btnExportar = document.getElementById('btnExportar');
  const theadRow = document.getElementById('theadRow');
  const tbodyDatos = document.getElementById('tbodyDatos');
  const lblFecha = document.getElementById('lblFecha');
  const estado = document.getElementById('estado');

  lblFecha.textContent = fechaActual();

  let laboratorios = [];
  let laboratorioSeleccionado = null;
  let selectedLabIds = [];
  let visibleColumns = [];
  let currentRows = [];

  const allColumns = [
    { key: 'NOMBRE', label: 'Nombre' },
    { key: 'PRESENTACION', label: 'Presentación' },
    { key: 'PRECIO', label: 'Precio' },
    { key: 'TROQUEL', label: 'Troquel' },
    { key: 'CODIGO', label: 'Código' },
    { key: 'LABORATORIO', label: 'Laboratorio' },
    { key: 'STOCKACTUAL', label: 'Stock actual' },
    { key: 'FRACCIONADOS', label: 'Stock fraccionado' },
    { key: 'CANTIDADDESEADA', label: 'Stock deseado' },
    { key: 'STOCKMINIMO', label: 'Stock mínimo' },
    { key: 'MONODROGA', label: 'Monodroga' },
  ];

  function setEstado(msg) {
    estado.textContent = msg || '';
  }

  // Cargar labs y preferencias
  async function init() {
    setEstado('Cargando laboratorios y preferencias...');
    const [labsRes, prefsRes] = await Promise.all([
      window.api.obtenerLaboratorios(),
      window.api.getPreferencias(),
    ]);
    if (labsRes.success) {
      laboratorios = labsRes.data;
    }
    if (prefsRes.success) {
      selectedLabIds = Array.isArray(prefsRes.data.selectedLabIds) ? prefsRes.data.selectedLabIds : [];
      visibleColumns = Array.isArray(prefsRes.data.visibleColumns) && prefsRes.data.visibleColumns.length > 0
        ? prefsRes.data.visibleColumns
        : allColumns.map(c => c.key);
    } else {
      visibleColumns = allColumns.map(c => c.key);
    }
    renderChips();
    renderColumnOptions();
    if (selectedLabIds.length > 0) {
      await generar();
    }
    setEstado('Listo');
  }

  init();

  // Sugerencias al escribir
  inputLaboratorio.addEventListener('input', () => {
    const texto = inputLaboratorio.value.trim().toLowerCase();
    if (!texto) {
      sugerenciasLaboratorio.innerHTML = '';
      sugerenciasLaboratorio.classList.add('hidden');
      laboratorioSeleccionado = null;
      return;
    }
    const sugerencias = laboratorios.filter(lab =>
      lab.DESCRIPCION.toLowerCase().includes(texto)
    ).slice(0, 15);

    if (sugerencias.length === 0) {
      sugerenciasLaboratorio.innerHTML = '<div class="px-4 py-3 text-gray-500 text-center">Sin resultados</div>';
      sugerenciasLaboratorio.classList.remove('hidden');
      laboratorioSeleccionado = null;
      return;
    }

    sugerenciasLaboratorio.innerHTML = sugerencias.map(lab =>
      `<div class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors" data-id="${lab.ID}" data-nombre="${lab.DESCRIPCION}">${lab.DESCRIPCION}</div>`
    ).join('');
    sugerenciasLaboratorio.classList.remove('hidden');
    laboratorioSeleccionado = null;
  });

  sugerenciasLaboratorio.addEventListener('click', (e) => {
    const div = e.target.closest('div[data-id]');
    if (div) {
      inputLaboratorio.value = div.dataset.nombre;
      laboratorioSeleccionado = parseInt(div.dataset.id, 10);
      sugerenciasLaboratorio.classList.add('hidden');
    }
  });

  document.addEventListener('click', (e) => {
    if (!inputLaboratorio.contains(e.target) && !sugerenciasLaboratorio.contains(e.target)) {
      sugerenciasLaboratorio.classList.add('hidden');
    }
  });

  btnAgregarLab.addEventListener('click', async () => {
    if (!laboratorioSeleccionado) return;
    if (!selectedLabIds.includes(laboratorioSeleccionado)) {
      selectedLabIds.push(laboratorioSeleccionado);
      await window.api.setPreferencias({ selectedLabIds });
      renderChips();
    }
    inputLaboratorio.value = '';
    laboratorioSeleccionado = null;
  });

  btnLimpiarLabs.addEventListener('click', async () => {
    selectedLabIds = [];
    await window.api.setPreferencias({ selectedLabIds });
    renderChips();
  });

  function renderChips() {
    const idToLab = new Map(laboratorios.map(l => [String(l.ID), l.DESCRIPCION]));
    chipsLabs.innerHTML = selectedLabIds.map(id => {
      const name = idToLab.get(String(id)) || `ID ${id}`;
      return `<span class="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full border border-blue-200">
        ${name}
        <button class="ml-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-1 transition-colors" data-id="${id}" title="Quitar">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </span>`;
    }).join('');
  }

  chipsLabs.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    const id = parseInt(btn.dataset.id, 10);
    selectedLabIds = selectedLabIds.filter(x => Number(x) !== id);
    await window.api.setPreferencias({ selectedLabIds });
    renderChips();
  });

  function renderColumnOptions() {
    columnasOpciones.innerHTML = allColumns.map(col => {
      const checked = visibleColumns.includes(col.key) ? 'checked' : '';
      return `<label class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
        <input class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" type="checkbox" data-col="${col.key}" ${checked}/>
        <span class="text-sm font-medium text-gray-700">${col.label}</span>
      </label>`;
    }).join('');
  }

  columnasOpciones.addEventListener('change', async (e) => {
    const cb = e.target.closest('input[type="checkbox"][data-col]');
    if (!cb) return;
    const key = cb.getAttribute('data-col');
    if (cb.checked && !visibleColumns.includes(key)) {
      visibleColumns.push(key);
    } else if (!cb.checked) {
      visibleColumns = visibleColumns.filter(k => k !== key);
    }
    await window.api.setPreferencias({ visibleColumns });
    renderTable(currentRows);
  });

  async function generar() {
    if (selectedLabIds.length === 0) {
      setEstado('Seleccione al menos un laboratorio.');
      return;
    }
    setEstado('Generando informe...');
    const res = await window.api.generarInforme(selectedLabIds);
    if (!res.success) {
      setEstado(`Error: ${res.error}`);
      return;
    }
    currentRows = res.data || [];
    renderTable(currentRows);
    setEstado(`Filas: ${currentRows.length}`);
  }

  btnGenerar.addEventListener('click', generar);

  btnExportar.addEventListener('click', async () => {
    if (!currentRows || currentRows.length === 0) {
      setEstado('No hay datos para exportar.');
      return;
    }
    const columns = allColumns.filter(c => visibleColumns.includes(c.key));
    const res = await window.api.exportarExcel({ rows: currentRows, columns });
    if (res.success) setEstado(`Exportado: ${res.path}`);
    else if (res.error !== 'cancelado') setEstado(`Error exportando: ${res.error}`);
  });

  function renderTable(rows) {
    const cols = allColumns.filter(c => visibleColumns.includes(c.key));
    theadRow.innerHTML = cols.map(c => `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">${c.label}</th>`).join('');
    tbodyDatos.innerHTML = rows.map(r => {
      return `<tr class="hover:bg-gray-50 transition-colors">${cols.map(c => `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">${formatValue(r[c.key])}</td>`).join('')}</tr>`;
    }).join('');
  }

  function formatValue(v) {
    if (v == null) return '';
    if (typeof v === 'number') {
      return Number.isInteger(v) ? v.toString() : v.toFixed(2);
    }
    return String(v);
  }
});

function fechaActual() {
  const hoy = new Date();
  return hoy.toLocaleDateString('es-AR');
}