<footer id="login-footer" itemscope itemtype="http://schema.org/WPFooter">
  <div class="row column">
    <p class="copyright"><?php print t('Copyright'); ?> &copy; <?php echo date("Y"); ?> <?php print $site_name ?></p>
    <nav>
      <a href="<?php print render($front_page); ?>" rel="home"><svg class="icon icon-home"><use xlink:href="#icon-home"></use></svg>&nbsp;<?php print t('Home'); ?></a>
      <?php global $user;
      if($user->uid)
      { ?>
      <?php print l(t('My Account'), 'user'); ?>
      <?php } else { } ?>
    </nav>
  </div>
</footer>