/*
 * WashMate Laundry — UTS Pemrograman Web
 * Fitur utama (semua memakai JavaScript/jQuery):
 *  1. Navigasi antarhalaman memakai AJAX ($.ajax) tanpa reload penuh + dukungan tombol back/forward.
 *  2. Halaman Layanan: filter kategori dan simulasi harga interaktif.
 *  3. Halaman Pemesanan: validasi kolom dengan jQuery SEBELUM data dikirim ke server (HTTP POST via AJAX).
 */
(function ($) {
    'use strict';

    var API_URL = 'api/pesanan.php';
    var STORAGE_KEY = 'washmate_pesanan_simulasi';

    var PRICES = {
        'Cuci Kering Lipat': 7000,
        'Cuci Setrika': 9000,
        'Setrika Saja': 6000,
        'Cuci Ekspres': 14000,
        'Bedcover dan Selimut': 12000
    };

    var navigationRequest = null;

    /* ---------- util ---------- */
    function rupiah(amount) {
        return 'Rp' + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function todayLocal() {
        var now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    }

    function pageName(pathname) {
        var name = (pathname || '').split('/').pop();
        return name === '' ? 'index.html' : name;
    }

    function toast(message) {
        var $t = $('#toast');
        $t.text(message).addClass('show');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(function () { $t.removeClass('show'); }, 2600);
    }

    /* ---------- estimasi di formulir ---------- */
    function estimate() {
        var service = $('#layanan').val();
        var weight = parseFloat($('#berat').val());
        var price = PRICES[service];
        $('#estimate').text(service && price && weight > 0
            ? rupiah(Math.ceil(weight) * price)
            : 'Pilih layanan');
    }

    /* ---------- validasi jQuery ---------- */
    var rules = {
        nama: function (v) {
            if (!v) return 'Nama wajib diisi.';
            if (v.length < 2) return 'Nama minimal 2 karakter.';
            if (v.length > 100) return 'Nama maksimal 100 karakter.';
            if (!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .,'-]*$/.test(v)) return 'Nama hanya boleh berisi huruf dan tanda baca umum.';
            return '';
        },
        telepon: function (v) {
            if (!v) return 'Nomor telepon wajib diisi.';
            var clean = v.replace(/[\s-]/g, '');
            if (!/^(\+62|62|0)8[0-9]{7,12}$/.test(clean)) return 'Gunakan nomor seluler Indonesia, contoh 081234567890.';
            return '';
        },
        alamat: function (v) {
            if (!v) return 'Alamat wajib diisi.';
            if (v.length < 8) return 'Alamat terlalu singkat (minimal 8 karakter).';
            if (v.length > 500) return 'Alamat maksimal 500 karakter.';
            return '';
        },
        layanan: function (v) {
            if (!v) return 'Pilih salah satu jenis layanan.';
            if (!PRICES[v]) return 'Jenis layanan tidak dikenal.';
            return '';
        },
        berat: function (v) {
            if (v === '') return 'Berat cucian wajib diisi.';
            var n = Number(v);
            if (isNaN(n)) return 'Berat harus berupa angka.';
            if (n < 1) return 'Berat minimal 1 kg.';
            if (n > 100) return 'Berat maksimal 100 kg.';
            if ((n * 2) % 1 !== 0) return 'Gunakan kelipatan 0,5 kg (mis. 2 atau 2,5).';
            return '';
        },
        jadwal: function (v) {
            if (!v) return 'Tanggal layanan wajib diisi.';
            if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'Format tanggal tidak valid.';
            if (v < todayLocal()) return 'Tanggal tidak boleh sebelum hari ini.';
            var max = new Date(); max.setFullYear(max.getFullYear() + 1);
            if (v > max.toISOString().slice(0, 10)) return 'Tanggal maksimal 1 tahun dari sekarang.';
            return '';
        },
        catatan: function (v) {
            return v.length > 500 ? 'Catatan maksimal 500 karakter.' : '';
        }
    };

    function validateField(name) {
        var $input = $('#order-form [name="' + name + '"]');
        var $field = $input.closest('.field');
        var $msg = $field.find('.msg[data-for="' + name + '"]');
        var error = rules[name]($.trim($input.val()));
        if (name !== 'catatan') {
            $field.toggleClass('invalid', !!error).toggleClass('valid', !error);
            $msg.text(error);
            $input.attr('aria-invalid', error ? 'true' : 'false');
        }
        return error;
    }

    function validateForm() {
        var firstInvalid = null;
        $.each(rules, function (name) {
            if (validateField(name) && !firstInvalid) firstInvalid = name;
        });
        if (firstInvalid) $('#order-form [name="' + firstInvalid + '"]').trigger('focus');
        return !firstInvalid;
    }

    function showResult(type, html) {
        $('#form-result').removeClass('success error info').addClass(type).html(html);
    }

    function localCode() {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
        for (var i = 0; i < 5; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
        var d = new Date();
        var ymd = String(d.getFullYear()).slice(2) + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
        return 'WM-' + ymd + '-' + s;
    }

    function submitOrder($form) {
        var $btn = $form.find('button[type="submit"]');
        var payload = {};
        $.each($form.serializeArray(), function (_, f) { payload[f.name] = $.trim(f.value); });
        $btn.prop('disabled', true).text('Mengirim pesanan…');
        showResult('info', 'Mengirim data ke server…');

        $.ajax({
            url: API_URL,
            method: 'POST',
            data: payload,
            dataType: 'json',
            headers: { 'Accept': 'application/json' }
        }).done(function (res) {
            showResult('success',
                '<strong>♡ ' + res.message + '</strong><br>' +
                'Kode pesanan: <b>' + res.data.kode + '</b><br>' +
                'Estimasi biaya: <b>' + rupiah(res.data.total_biaya) + '</b><br>' +
                'Status: ' + res.data.status);
            resetForm($form);
        }).fail(function (xhr) {
            if (xhr.status === 422 && xhr.responseJSON && xhr.responseJSON.errors) {
                // Server menolak: tampilkan pesan di kolom terkait.
                $.each(xhr.responseJSON.errors, function (name, msgs) {
                    var $f = $form.find('[name="' + name + '"]').closest('.field');
                    $f.addClass('invalid').find('.msg[data-for="' + name + '"]').text(msgs[0]);
                });
                showResult('error', 'Server menolak sebagian data. Periksa kolom yang ditandai.');
            } else if ([0, 404, 405, 501].indexOf(xhr.status) !== -1) {
                // Tidak ada server PHP (mis. GitHub Pages / file lokal): simulasi supaya alur tetap bisa didemokan.
                var order = {
                    kode: localCode(),
                    layanan: payload.layanan,
                    berat: payload.berat,
                    total_biaya: Math.ceil(parseFloat(payload.berat)) * PRICES[payload.layanan],
                    status: 'Menunggu Konfirmasi (simulasi)'
                };
                try {
                    var list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                    list.push($.extend({}, payload, order));
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
                } catch (e) { /* penyimpanan lokal tidak tersedia */ }
                showResult('info',
                    '<strong>Mode simulasi</strong> — server PHP/database tidak aktif, jadi pesanan hanya disimpan di browser ini.<br>' +
                    'Kode pesanan: <b>' + order.kode + '</b><br>' +
                    'Estimasi biaya: <b>' + rupiah(order.total_biaya) + '</b><br>' +
                    'Status: ' + order.status);
                resetForm($form);
            } else {
                showResult('error', 'Pesanan belum berhasil dikirim (kode ' + xhr.status + '). Coba lagi beberapa saat.');
            }
        }).always(function () {
            $btn.prop('disabled', false).text('Kirim pesanan ♡');
        });
    }

    function resetForm($form) {
        $form[0].reset();
        $form.find('.field').removeClass('invalid valid');
        $form.find('.msg').not('.counter').text('');
        initializeCurrentPage();
    }

    /* ---------- halaman layanan: filter + simulator ---------- */
    function applyFilter(category) {
        var shown = 0;
        $('#service-list .service-card').each(function () {
            var $c = $(this), cat = $c.data('kategori');
            var match = category === 'semua' || cat === category;
            if (match && cat !== 'bantuan') shown++;
            if (match) { $c.stop(true, true).fadeIn(200); } else { $c.stop(true, true).fadeOut(150); }
        });
        $('#filter-count').text(shown + ' layanan ditampilkan');
    }

    var simShown = 0;
    function updateSimulator(animate) {
        var $opt = $('#sim-layanan option:selected');
        if (!$opt.length) return;
        var perKg = Number($opt.data('harga')), days = Number($opt.data('hari'));
        var kg = Number($('#sim-berat').val());
        var base = perKg * kg;
        var antar = $('#sim-antar').is(':checked') ? Number($('#sim-antar').data('biaya')) : 0;
        var parfum = $('#sim-parfum').is(':checked') ? Number($('#sim-parfum').data('biaya')) * kg : 0;
        var total = base + antar + parfum;

        $('#sim-berat-val').text(kg);
        var rows = '<li><span>' + $opt.val() + ' (' + kg + ' kg × ' + rupiah(perKg) + ')</span><b>' + rupiah(base) + '</b></li>';
        if (antar) rows += '<li><span>Antar-jemput</span><b>' + rupiah(antar) + '</b></li>';
        if (parfum) rows += '<li><span>Parfum premium (' + kg + ' kg)</span><b>' + rupiah(parfum) + '</b></li>';
        $('#sim-detail').html(rows);

        var eta = new Date(); eta.setDate(eta.getDate() + days);
        $('#sim-eta').text('Perkiraan selesai: ' + eta.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) + ' (' + days + ' hari)');

        var svc = { 'Cuci Kering Lipat': 'kering-lipat', 'Cuci Setrika': 'cuci-setrika', 'Setrika Saja': 'setrika', 'Cuci Ekspres': 'ekspres', 'Bedcover dan Selimut': 'bedcover' }[$opt.val()];
        $('#sim-order').attr('href', 'pemesanan.html?layanan=' + encodeURIComponent($opt.val()) + '&berat=' + kg);
        $('#sim-img').attr('src', 'images/svc-' + svc + '.svg');

        if (animate === false) { simShown = total; $('#sim-total').text(rupiah(total)); return; }
        $({ n: simShown }).stop(true).animate({ n: total }, {
            duration: 350,
            step: function (now) { $('#sim-total').text(rupiah(now)); },
            complete: function () { simShown = total; $('#sim-total').text(rupiah(total)); }
        });
    }

    /* ---------- inisialisasi per halaman (juga dipanggil setelah navigasi AJAX) ---------- */
    function initializeCurrentPage() {
        var $date = $('#jadwal');
        if ($date.length) {
            $date.attr('min', todayLocal());
            if (!$date.val()) $date.val(todayLocal());
        }
        if ($('#order-form').length) {
            // Prefill dari simulator (layanan.html -> pemesanan.html?layanan=..&berat=..)
            var q = new URLSearchParams(window.location.search);
            if (q.get('layanan') && PRICES[q.get('layanan')]) $('#layanan').val(q.get('layanan'));
            if (q.get('berat') && !isNaN(q.get('berat'))) $('#berat').val(q.get('berat'));
        }
        if ($('#estimate').length) estimate();
        if ($('#catatan-count').length) $('#catatan-count').text($('#catatan').val().length);
        if ($('#service-list').length) applyFilter('semua');
        if ($('#simulator').length) updateSimulator(false);
    }

    function updateActiveNavigation(pathname) {
        var current = pageName(pathname);
        $('.nav a').each(function () {
            var active = pageName(new URL(this.href, window.location.href).pathname) === current;
            $(this).toggleClass('active', active);
            if (active) { $(this).attr('aria-current', 'page'); } else { $(this).removeAttr('aria-current'); }
        });
    }

    /* ---------- navigasi AJAX ---------- */
    function navigate(url, addHistory) {
        var target = new URL(url, window.location.href);
        if (navigationRequest) navigationRequest.abort();
        $('body').attr('aria-busy', 'true');
        $('.nav').removeClass('show');
        $('.menu-toggle').attr('aria-expanded', 'false');

        navigationRequest = $.ajax({ url: target.href, method: 'GET', dataType: 'html' })
            .done(function (html) {
                var parsed = new DOMParser().parseFromString(html, 'text/html');
                var nextMain = parsed.querySelector('main');
                var currentMain = document.querySelector('main');
                if (!nextMain || !currentMain) { window.location.href = target.href; return; }

                currentMain.innerHTML = nextMain.innerHTML;
                if (parsed.title) document.title = parsed.title;
                updateActiveNavigation(target.pathname);
                if (addHistory) window.history.pushState({ ajax: true }, '', target.pathname + target.search + target.hash);
                initializeCurrentPage();
                window.scrollTo(0, 0);
                currentMain.focus({ preventScroll: true });
            })
            .fail(function (_xhr, status) {
                if (status !== 'abort') window.location.href = target.href; // cadangan: navigasi biasa
            })
            .always(function () {
                $('body').removeAttr('aria-busy');
                navigationRequest = null;
            });
    }

    // Delegasi event: tetap bekerja walau isi <main> diganti lewat AJAX.
    $(document).on('click', 'a[href]', function (event) {
        var href = this.getAttribute('href');
        if (!href || href.charAt(0) === '#' || this.hasAttribute('download') ||
            (this.target && this.target !== '_self') || event.ctrlKey || event.metaKey ||
            event.shiftKey || event.altKey || event.button !== 0) return;

        var target = new URL(this.href, window.location.href);
        var isPage = /\.html$/.test(target.pathname) || /\/$/.test(target.pathname);
        if (target.origin !== window.location.origin || !isPage) return;

        event.preventDefault();
        if (target.pathname === window.location.pathname) { window.scrollTo(0, 0); return; }
        navigate(target.href, true);
    });

    window.addEventListener('popstate', function () { navigate(window.location.href, false); });

    $(document).on('click', '.menu-toggle', function () {
        var opened = $('.nav').toggleClass('show').hasClass('show');
        $(this).attr('aria-expanded', opened ? 'true' : 'false');
    });

    /* ---------- event: formulir ---------- */
    $(document).on('input change', '#layanan, #berat', estimate);
    $(document).on('input', '#catatan', function () { $('#catatan-count').text(this.value.length); });
    $(document).on('blur change', '#order-form input[name], #order-form select[name], #order-form textarea[name]', function () {
        if (this.name && rules[this.name]) validateField(this.name);
    });
    $(document).on('input', '#order-form .invalid input, #order-form .invalid textarea', function () {
        validateField(this.name);
    });
    $(document).on('submit', '#order-form', function (event) {
        event.preventDefault();           // kirim lewat AJAX, bukan submit biasa
        if (!validateForm()) {            // validasi jQuery dulu; jika gagal, TIDAK ada request ke server
            showResult('error', 'Masih ada kolom yang perlu diperbaiki. Cek pesan merah di bawah kolom.');
            return;
        }
        submitOrder($(this));
    });

    /* ---------- event: halaman layanan ---------- */
    $(document).on('click', '.chip', function () {
        $('.chip').removeClass('active').attr('aria-pressed', 'false');
        $(this).addClass('active').attr('aria-pressed', 'true');
        applyFilter($(this).data('filter'));
    });
    $(document).on('input change', '#sim-layanan, #sim-berat, #sim-antar, #sim-parfum', function () { updateSimulator(true); });
    $(document).on('click', '#sim-reset', function () {
        $('#sim-layanan').val('Cuci Setrika');
        $('#sim-berat').val(3);
        $('#sim-antar, #sim-parfum').prop('checked', false);
        updateSimulator(true);
        toast('Simulasi diatur ulang');
    });

    $(function () {
        initializeCurrentPage();
        updateActiveNavigation(window.location.pathname);
        window.history.replaceState({ ajax: true }, '', window.location.href);
    });
})(jQuery);
