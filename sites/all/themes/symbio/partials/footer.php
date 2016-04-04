<footer class="footer" itemscope itemtype="http://schema.org/WPFooter">
  <div class="row column">
    <a class="footer-logo-link" href="<?php print render($front_page); ?>" title="<?php print t('Home'); ?>" rel="home">
      <svg class="footer-logo" aria-labelledby="silhouette-symbio-logo" preserveAspectRatio="xMinYMin meet"><use xlink:href="#silhouette-symbio-logo"/></svg>
    </a>
    <p class="copyright"><?php print t('Copyright'); ?> &copy; <?php echo date("Y"); ?> <?php print $site_name ?></p>
    <?php if ($page['footer']): ?>
    <?php print render($page['footer']); ?>
    <?php endif; ?>
  </div>
</footer>