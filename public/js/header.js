        $(document).foundation();

        // Function to show selected div and hide others
        function showDiv(divId) {
            // Hide all divs
            document.getElementById('temperatureDiv').style.display = 'none';
            document.getElementById('precipitationDiv').style.display = 'none';
            document.getElementById('windDiv').style.display = 'none';

            // Show selected div
            document.getElementById(divId).style.display = '';

            // Update active class on links
            document.getElementById('temperatureLink').classList.remove('active');
            document.getElementById('precipitationLink').classList.remove('active');
            document.getElementById('windLink').classList.remove('active');
            document.getElementById(divId.replace('Div', 'Link')).classList.add('active');
        };

        function setActiveTab(tabId) {
  localStorage.setItem('activeTab', tabId);
}

// On page load, check localStorage for the active tab
document.addEventListener('DOMContentLoaded', () => {
  const activeTab = localStorage.getItem('activeTab') || 'temperatureDiv';

  // Hide all tabs
  document.getElementById('temperatureDiv').style.display = 'none';
  document.getElementById('precipitationDiv').style.display = 'none';
  document.getElementById('windDiv').style.display = 'none';

  // Show the active tab
  document.getElementById(activeTab).style.display = '';

  // Update the active class on links
  document.getElementById('temperatureLink').classList.remove('active');
  document.getElementById('precipitationLink').classList.remove('active');
  document.getElementById('windLink').classList.remove('active');
  document.getElementById(activeTab.replace('Div', 'Link')).classList.add('active');
});