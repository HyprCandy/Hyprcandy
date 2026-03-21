imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Gio = '2.0';
imports.gi.versions.GLib = '2.0';
imports.gi.versions.Gdk = '4.0';
const { Gtk, Gio, GLib, Gdk } = imports.gi;

const scriptDir = GLib.path_get_dirname(imports.system.programInvocationName);
imports.searchPath.unshift(scriptDir);

// System monitor data structures
let systemData = {
    cpu: { usage: 0, cores: [], temp: 0 },
    memory: { used: 0, total: 0, available: 0, swap: { used: 0, total: 0 } },
    disk: [],
    network: { rx: 0, tx: 0, rxTotal: 0, txTotal: 0 },
    processes: [],
    uptime: 0,
    loadAvg: [0, 0, 0],
    temperature: { cpu: 0, available: false }
};

// Add this variable at the top with other system data
let previousCPUStats = null;

// Replace your getCPUInfo function with this corrected version
function getCPUInfo() {
    try {
        let [ok, contents] = GLib.file_get_contents('/proc/stat');
        if (!ok) return { usage: 0, cores: [] };
        
        let lines = imports.byteArray.toString(contents).split('\n');
        let cpuLine = lines[0];
        let match = cpuLine.match(/cpu\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
        
        if (match) {
            let user = parseInt(match[1]);
            let nice = parseInt(match[2]);
            let system = parseInt(match[3]);
            let idle = parseInt(match[4]);
            
            let currentStats = {
                user: user,
                nice: nice,
                system: system,
                idle: idle,
                total: user + nice + system + idle
            };
            
            let usage = 0;
            
            // Calculate usage only if we have previous stats
            if (previousCPUStats) {
                let totalDiff = currentStats.total - previousCPUStats.total;
                let idleDiff = currentStats.idle - previousCPUStats.idle;
                
                if (totalDiff > 0) {
                    usage = Math.round(((totalDiff - idleDiff) / totalDiff) * 100);
                }
            }
            
            // Store current stats for next calculation
            previousCPUStats = currentStats;
            
            return { usage: usage, cores: [] };
        }
    } catch (e) {
        print('Error reading CPU info:', e);
    }
    return { usage: 0, cores: [] };
}

function getTemperatureInfo() {
    let temps = [];
    
    try {
        // Try to read from thermal zones (most common on modern systems)
        let thermalZones = [];
        for (let i = 0; i < 10; i++) { // Check up to 10 thermal zones
            let thermalPath = `/sys/class/thermal/thermal_zone${i}/temp`;
            let typePath = `/sys/class/thermal/thermal_zone${i}/type`;
            
            try {
                let [tempOk, tempContents] = GLib.file_get_contents(thermalPath);
                let [typeOk, typeContents] = GLib.file_get_contents(typePath);
                
                if (tempOk && typeOk) {
                    let tempMilliC = parseInt(imports.byteArray.toString(tempContents).trim());
                    let type = imports.byteArray.toString(typeContents).trim();
                    let tempC = tempMilliC / 1000;
                    
                    // Filter out unrealistic temperatures
                    if (tempC > 0 && tempC < 150) {
                        thermalZones.push({ type: type, temp: tempC });
                    }
                }
            } catch (e) {
                // Thermal zone doesn't exist, continue
                break;
            }
        }
        
        // Find CPU temperature from thermal zones
        for (let zone of thermalZones) {
            if (zone.type.toLowerCase().includes('cpu') || 
                zone.type.toLowerCase().includes('core') ||
                zone.type.toLowerCase().includes('x86_pkg_temp')) {
                return { cpu: Math.round(zone.temp), available: true };
            }
        }
        
        // If no CPU temp found, use the first available temperature
        if (thermalZones.length > 0) {
            return { cpu: Math.round(thermalZones[0].temp), available: true };
        }
        
    } catch (e) {
        print('Error reading thermal zones:', e);
    }
    
    try {
        // Fallback: try lm-sensors via sensors command
        let [ok, stdout] = GLib.spawn_command_line_sync('sensors -A');
        if (ok) {
            let output = imports.byteArray.toString(stdout);
            let lines = output.split('\n');
            
            for (let line of lines) {
                // Look for CPU temperature patterns
                if (line.includes('Core') || line.includes('CPU') || line.includes('Tctl')) {
                    let match = line.match(/([+-]?\d+\.?\d*).?°C/);
                    if (match) {
                        let temp = parseFloat(match[1]);
                        if (temp > 0 && temp < 150) {
                            return { cpu: Math.round(temp), available: true };
                        }
                    }
                }
            }
        }
    } catch (e) {
        print('Error reading sensors:', e);
    }
    
    try {
        // Another fallback: try hwmon
        for (let i = 0; i < 5; i++) {
            let tempPath = `/sys/class/hwmon/hwmon${i}/temp1_input`;
            let labelPath = `/sys/class/hwmon/hwmon${i}/temp1_label`;
            
            try {
                let [tempOk, tempContents] = GLib.file_get_contents(tempPath);
                if (tempOk) {
                    let tempMilliC = parseInt(imports.byteArray.toString(tempContents).trim());
                    let tempC = tempMilliC / 1000;
                    
                    if (tempC > 0 && tempC < 150) {
                        return { cpu: Math.round(tempC), available: true };
                    }
                }
            } catch (e) {
                // Continue to next hwmon
            }
        }
    } catch (e) {
        print('Error reading hwmon:', e);
    }
    
    return { cpu: 0, available: false };
}

function getMemoryInfo() {
    try {
        let [ok, contents] = GLib.file_get_contents('/proc/meminfo');
        if (!ok) return { used: 0, total: 0, available: 0, swap: { used: 0, total: 0 } };
        
        let lines = imports.byteArray.toString(contents).split('\n');
        let memInfo = {};
        
        for (let line of lines) {
            let match = line.match(/^(\w+):\s*(\d+)\s*kB/);
            if (match) {
                memInfo[match[1]] = parseInt(match[2]) * 1024; // Convert to bytes
            }
        }
        
        let total = memInfo.MemTotal || 0;
        let available = memInfo.MemAvailable || 0;
        let used = total - available;
        let swapTotal = memInfo.SwapTotal || 0;
        let swapFree = memInfo.SwapFree || 0;
        let swapUsed = swapTotal - swapFree;
        
        return {
            used: used,
            total: total,
            available: available,
            swap: { used: swapUsed, total: swapTotal }
        };
    } catch (e) {
        print('Error reading memory info:', e);
    }
    return { used: 0, total: 0, available: 0, swap: { used: 0, total: 0 } };
}

function getDiskInfo() {
    try {
        let [ok, stdout] = GLib.spawn_command_line_sync('df -h --output=source,size,used,avail,pcent,target');
        if (!ok) return [];
        
        let lines = imports.byteArray.toString(stdout).split('\n').slice(1); // Skip header
        let disks = [];
        
        for (let line of lines) {
            if (line.trim() === '') continue;
            let parts = line.trim().split(/\s+/);
            if (parts.length >= 6) {
                disks.push({
                    device: parts[0],
                    size: parts[1],
                    used: parts[2],
                    available: parts[3],
                    percentage: parseInt(parts[4].replace('%', '')),
                    mountpoint: parts[5]
                });
            }
        }
        return disks;
    } catch (e) {
        print('Error reading disk info:', e);
    }
    return [];
}

function getNetworkInfo() {
    try {
        let [ok, contents] = GLib.file_get_contents('/proc/net/dev');
        if (!ok) return { rx: 0, tx: 0, rxTotal: 0, txTotal: 0 };
        
        let lines = imports.byteArray.toString(contents).split('\n').slice(2); // Skip headers
        let totalRx = 0, totalTx = 0;
        
        for (let line of lines) {
            if (line.trim() === '') continue;
            let parts = line.trim().split(/\s+/);
            if (parts.length >= 10 && !parts[0].includes('lo:')) { // Skip loopback
                totalRx += parseInt(parts[1]) || 0;
                totalTx += parseInt(parts[9]) || 0;
            }
        }
        
        return { rx: 0, tx: 0, rxTotal: totalRx, txTotal: totalTx };
    } catch (e) {
        print('Error reading network info:', e);
    }
    return { rx: 0, tx: 0, rxTotal: 0, txTotal: 0 };
}

function getProcessList() {
    try {
        let [ok, stdout] = GLib.spawn_command_line_sync('ps aux --sort=-%cpu');
        if (!ok) return [];
        
        let lines = imports.byteArray.toString(stdout).split('\n').slice(1); // Skip header
        let processes = [];
        
        for (let i = 0; i < Math.min(lines.length, 20); i++) { // Top 20 processes
            let line = lines[i];
            if (line.trim() === '') continue;
            let parts = line.trim().split(/\s+/, 11);
            if (parts.length >= 11) {
                processes.push({
                    user: parts[0],
                    pid: parts[1],
                    cpu: parseFloat(parts[2]),
                    memory: parseFloat(parts[3]),
                    command: parts[10]
                });
            }
        }
        return processes;
    } catch (e) {
        print('Error reading process list:', e);
    }
    return [];
}

function getSystemUptime() {
    try {
        let [ok, contents] = GLib.file_get_contents('/proc/uptime');
        if (!ok) return 0;
        
        let uptime = parseFloat(imports.byteArray.toString(contents).split(' ')[0]);
        return uptime;
    } catch (e) {
        print('Error reading uptime:', e);
    }
    return 0;
}

function getLoadAverage() {
    try {
        let [ok, contents] = GLib.file_get_contents('/proc/loadavg');
        if (!ok) return [0, 0, 0];
        
        let parts = imports.byteArray.toString(contents).split(' ');
        return [
            parseFloat(parts[0]) || 0,
            parseFloat(parts[1]) || 0,
            parseFloat(parts[2]) || 0
        ];
    } catch (e) {
        print('Error reading load average:', e);
    }
    return [0, 0, 0];
}

function updateSystemData() {
    systemData.cpu = getCPUInfo();
    systemData.memory = getMemoryInfo();
    systemData.disk = getDiskInfo();
    systemData.network = getNetworkInfo();
    systemData.processes = getProcessList();
    systemData.uptime = getSystemUptime();
    systemData.loadAvg = getLoadAverage();
    systemData.temperature = getTemperatureInfo(); 
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

function createSystemMonitorBox() {
    print('🎨 Setting up CSS styling...');
    
    // Check if we have a valid display before setting up CSS
    let display;
    try {
        display = Gdk.Display.get_default();
        if (!display) {
            print('⚠️ No display available, skipping CSS setup');
        } else {
            print('✅ Display available, setting up CSS');
        }
    } catch (e) {
        print(`⚠️ Error getting display: ${e.message}`);
        display = null;
    }

    // Load user GTK color theme CSS only if display is available
    if (display) {
        const userColorsProvider = new Gtk.CssProvider();
        try {
            const colorsPath = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'gtk-3.0', 'colors.css']);
            if (GLib.file_test(colorsPath, GLib.FileTest.EXISTS)) {
                userColorsProvider.load_from_path(colorsPath);
                Gtk.StyleContext.add_provider_for_display(
                    display,
                    userColorsProvider,
                    Gtk.STYLE_PROVIDER_PRIORITY_USER
                );
                print('✅ User color theme loaded');
            } else {
                print('⚠️ User color theme not found, using defaults');
            }
        } catch (e) {
            print(`⚠️ Error loading user colors: ${e.message}`);
        }
    }

    // Custom CSS for system monitor
    if (display) {
        const cssProvider = new Gtk.CssProvider();
        let css = `
        .system-monitor-frame {
            border-radius: 6px;
            min-width: 260px;
            min-height: 300px;
            padding: 6px;
            box-shadow: 0 2px 12px 0 rgba(0,0,0,0.22);
            //background: linear-gradient(45deg, @source_color 0%, @background 100%);
            background-size: cover;
        }
        .monitor-section {
            //background: rgba(255, 255, 255, 0.05);
            background: linear-gradient(45deg, @blur_background 0%, @background 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            padding: 4px;
            margin: 1px;
        }
        .monitor-title {
            font-size: 1em;
            font-weight: 700;
            color: @primary_fixed_dim;
            text-shadow: 0 0 4px @background;
            margin-bottom: 2px;
        }
        .monitor-value {
            font-size: 1em;
            font-weight: 600;
            color: #ffffff;
            text-shadow: 0 0 3px @background;
        }
        .monitor-label {
            font-size: 0.85em;
            font-weight: 500;
            color: #f0f0f0;
            text-shadow: 0 0 2px rgba(240, 240, 240, 0.5);
        }
        .process-row {
            padding: 2px 4px;
            margin: 1px 0;
            border-radius: 3px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .high-usage {
            background: rgba(255, 107, 107, 0.5);
            border-color: rgba(255, 107, 107, 0.4);
        }
        .medium-usage {
            background: rgba(255, 193, 7, 0.5);
            border-color: rgba(255, 193, 7, 0.4);
        }
        .low-usage {
            background: rgba(76, 175, 80, 0.5);
            border-color: rgba(76, 175, 80, 0.4);
        }
        .progress-bar {
            min-height: 8px;
            margin: 4px 0;
        }
        .progress-bar progressbar {
            background: linear-gradient(45deg, @source_color 0%, @scrim 100%);
            box-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
        }
        .progress-bar progressbar trough {
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }
        .progress-bar progressbar fill {
            background: linear-gradient(45deg, @source_color 0%, @scrim 100%);
            border-radius: 4px;
            box-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
        }
        .scrolled-area {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        `;
        try {
            cssProvider.load_from_data(css, css.length);
            Gtk.StyleContext.add_provider_for_display(
                display,
                cssProvider,
                Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
            );
            print('✅ Custom CSS loaded successfully');
        } catch (e) {
            print(`⚠️ Error loading custom CSS: ${e.message}`);
        }
    } else {
        print('⚠️ Skipping CSS setup due to no display');
    }

    // Main container
    print('📦 Creating main container...');
    let mainBox;
    try {
        mainBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 2,
            margin_top: 4,
            margin_bottom: 4,
            margin_start: 4,
            margin_end: 4
        });
        mainBox.add_css_class('system-monitor-frame');
        print('✅ Main container created');
    } catch (e) {
        print(`❌ Error creating main container: ${e.message}`);
        throw e;
    }

    // Title
    const titleLabel = new Gtk.Label({
        label: 'System',
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.START
    });
    titleLabel.add_css_class('monitor-title');
    mainBox.append(titleLabel);

    // CPU Section - Compact
    const cpuSection = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 2
    });
    cpuSection.add_css_class('monitor-section');
    
    const cpuTitle = new Gtk.Label({ label: 'CPU', halign: Gtk.Align.START });
    cpuTitle.add_css_class('monitor-title');
    
    const cpuUsageLabel = new Gtk.Label({ label: '0%', halign: Gtk.Align.START });
    cpuUsageLabel.add_css_class('monitor-value');
    
    const cpuProgress = new Gtk.ProgressBar();
    cpuProgress.add_css_class('progress-bar');
    cpuProgress.set_fraction(0.0);
    
    cpuSection.append(cpuTitle);
    cpuSection.append(cpuUsageLabel);
    cpuSection.append(cpuProgress);
    
    mainBox.append(cpuSection);

    // Memory Section - Compact
    const memorySection = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 2
    });
    memorySection.add_css_class('monitor-section');
    
    const memoryTitle = new Gtk.Label({ label: 'Memory', halign: Gtk.Align.START });
    memoryTitle.add_css_class('monitor-title');
    
    const memoryUsageLabel = new Gtk.Label({ label: '0%', halign: Gtk.Align.START });
    memoryUsageLabel.add_css_class('monitor-value');
    
    const memoryProgress = new Gtk.ProgressBar();
    memoryProgress.add_css_class('progress-bar');
    memoryProgress.set_fraction(0.0);
    
    memorySection.append(memoryTitle);
    memorySection.append(memoryUsageLabel);
    memorySection.append(memoryProgress);
    
    mainBox.append(memorySection);
    
    // Temperature Section - Compact (add after memory section)
    const temperatureSection = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 2
    });
    temperatureSection.add_css_class('monitor-section');
    
    const temperatureTitle = new Gtk.Label({ label: 'Temperature', halign: Gtk.Align.START });
    temperatureTitle.add_css_class('monitor-title');
    
    const temperatureLabel = new Gtk.Label({ label: '--°C', halign: Gtk.Align.START });
    temperatureLabel.add_css_class('monitor-value');
    
    const temperatureStatusLabel = new Gtk.Label({ label: 'CPU Temperature', halign: Gtk.Align.START });
    temperatureStatusLabel.add_css_class('monitor-label');
    
    temperatureSection.append(temperatureTitle);
    temperatureSection.append(temperatureLabel);
    temperatureSection.append(temperatureStatusLabel);
    
    mainBox.append(temperatureSection);

    // System Info Section - Compact
    const sysInfoSection = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 2
    });
    sysInfoSection.add_css_class('monitor-section');
    
    const sysInfoTitle = new Gtk.Label({ label: 'System', halign: Gtk.Align.START });
    sysInfoTitle.add_css_class('monitor-title');
    
    const diskUsageLabel = new Gtk.Label({ label: 'Disk: --', halign: Gtk.Align.START });
    diskUsageLabel.add_css_class('monitor-value');
    
    const uptimeLabel = new Gtk.Label({ label: 'Uptime: --', halign: Gtk.Align.START });
    uptimeLabel.add_css_class('monitor-label');
    
    sysInfoSection.append(sysInfoTitle);
    sysInfoSection.append(diskUsageLabel);
    sysInfoSection.append(uptimeLabel);
    
    mainBox.append(sysInfoSection);

    // Top Process Section - Compact
    const processSection = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 2
    });
    processSection.add_css_class('monitor-section');
    
    const processTitle = new Gtk.Label({ label: 'Top Process', halign: Gtk.Align.START });
    processTitle.add_css_class('monitor-title');
    
    const topProcessLabel = new Gtk.Label({ label: 'None', halign: Gtk.Align.START });
    topProcessLabel.add_css_class('monitor-value');
    
    const processCpuLabel = new Gtk.Label({ label: 'CPU: 0%', halign: Gtk.Align.START });
    processCpuLabel.add_css_class('monitor-label');
    
    processSection.append(processTitle);
    processSection.append(topProcessLabel);
    processSection.append(processCpuLabel);
    
    mainBox.append(processSection);

    // Update functions
    function updateCPUDisplay() {
        cpuUsageLabel.set_label(`${systemData.cpu.usage}%`);
        cpuProgress.set_fraction(systemData.cpu.usage / 100.0);
    }

    function updateMemoryDisplay() {
        const percentage = systemData.memory.total > 0 ? 
            Math.round((systemData.memory.used / systemData.memory.total) * 100) : 0;
        memoryUsageLabel.set_label(`${percentage}%`);
        memoryProgress.set_fraction(percentage / 100.0);
    }
    
    function updateTemperatureDisplay() {
        if (systemData.temperature.available) {
            temperatureLabel.set_label(`${systemData.temperature.cpu}°C`);
            
            // Color code based on temperature
            if (systemData.temperature.cpu > 90) {
                temperatureStatusLabel.set_label('CPU: Critical 󰈸');
                temperatureLabel.add_css_class('high-usage');
            } else if (systemData.temperature.cpu > 65) {
                temperatureStatusLabel.set_label('CPU: Hot ');
                temperatureLabel.add_css_class('medium-usage');
            } else {
                temperatureStatusLabel.set_label('CPU: Normal ');
                temperatureLabel.add_css_class('low-usage');
            }
        } else {
            temperatureLabel.set_label('N/A');
            temperatureStatusLabel.set_label('CPU: Unavailable');
        }
    }

    function updateSystemInfoDisplay() {
        // Show main disk usage (root filesystem)
        let mainDisk = systemData.disk.find(disk => disk.mountpoint === '/');
        if (mainDisk) {
            diskUsageLabel.set_label(`Disk: ${mainDisk.percentage}%`);
        } else if (systemData.disk.length > 0) {
            diskUsageLabel.set_label(`Disk: ${systemData.disk[0].percentage}%`);
        } else {
            diskUsageLabel.set_label('Disk: --');
        }
        
        uptimeLabel.set_label(`Uptime: ${formatUptime(systemData.uptime)}`);
    }

    function updateProcessDisplay() {
        // Show only the top process
        if (systemData.processes.length > 0) {
            let topProc = systemData.processes[0];
            let procName = topProc.command.length > 20 ? 
                topProc.command.substring(0, 20) + '...' : topProc.command;
            topProcessLabel.set_label(procName);
            processCpuLabel.set_label(`CPU: ${topProc.cpu.toFixed(1)}%`);
        } else {
            topProcessLabel.set_label('None');
            processCpuLabel.set_label('CPU: 0%');
        }
    }

    function updateAllDisplays() {
        updateSystemData();
        updateCPUDisplay();
        updateMemoryDisplay();
        updateTemperatureDisplay();
        updateSystemInfoDisplay();
        updateProcessDisplay();
    }

    // Initial update
    updateAllDisplays();

    // Setup periodic updates
    const updateInterval = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2000, () => {
        updateAllDisplays();
        return true;
    });

    // Store update interval for cleanup
    mainBox._updateInterval = updateInterval;

    return mainBox;
}

// Export the function
var exports = {
    createSystemMonitorBox
};
