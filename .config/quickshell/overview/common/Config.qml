pragma Singleton
pragma ComponentBehavior: Bound

import QtQuick
import Quickshell

Singleton {
    id: root
    
    property QtObject options: QtObject {
        property QtObject appearance: QtObject {
            property bool useMatugenColors: true
        }

        property QtObject overview: QtObject {
            property int rows: 2
            property int columns: 5
            property real scale: 0.16
            property bool enable: true
            property bool hideEmptyRows: true  // Hide workspace rows with no windows
        }
        
        property QtObject hacks: QtObject {
            property int arbitraryRaceConditionDelay: 150
        }
    }
}
